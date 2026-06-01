import type {
  Accelerator,
  Ecosystem,
  PythonAgents,
  PythonGenai,
  PythonMl,
  PythonOrm,
} from "../types";
import { UserCancelledError } from "../utils/errors";
import { isCancel, navigableConfirm, navigableMultiselect, navigableSelect } from "./navigable";

/**
 * Python capability prompts (ORM, ML / GenAI / Agents packs, accelerator, and
 * the opt-in starter). Each is gated on `ecosystem === "python"` — under `ts`
 * it resolves to its inert default with no UI — and short-circuits to a provided
 * flag. The accelerator step is additionally gated on whether a torch-based pack
 * was selected.
 */

// Heavy GenAI packs own the torch graph and imply a GPU; they are mutually
// constrained (one of vllm/unsloth/trl) and incompatible with a cpu accelerator
// — mirrors PythonGenaiListSchema and validatePythonConstraints.
const HEAVY_GENAI_PACKS: readonly PythonGenai[] = [
  "transformers",
  "vllm",
  "unsloth",
  "trl",
  "peft",
  "accelerate",
] as const;
const HEAVY_GENAI_EXCLUSIVE: readonly PythonGenai[] = ["vllm", "unsloth", "trl"] as const;

function cancelGuard<T>(response: T | symbol): T {
  if (isCancel(response)) throw new UserCancelledError({ message: "Operation cancelled" });
  return response as T;
}

export async function getPythonOrmChoice(
  ecosystem: Ecosystem,
  pythonOrm?: PythonOrm,
): Promise<PythonOrm> {
  if (ecosystem !== "python") return "none";
  if (pythonOrm !== undefined) return pythonOrm;

  const response = await navigableSelect<PythonOrm>({
    message: "Select Python ORM",
    options: [
      { value: "none" as const, label: "No ORM", hint: "No Python ORM" },
      {
        value: "sqlalchemy" as const,
        label: "SQLAlchemy",
        hint: "The Python SQL toolkit and ORM",
      },
      {
        value: "sqlmodel" as const,
        label: "SQLModel",
        hint: "SQLAlchemy + Pydantic models",
      },
      {
        value: "tortoise" as const,
        label: "Tortoise ORM",
        hint: "Async ORM inspired by Django",
      },
    ],
    initialValue: "none",
  });

  return cancelGuard(response);
}

export async function getPythonMlChoice(
  ecosystem: Ecosystem,
  pythonMl?: PythonMl[],
): Promise<PythonMl[]> {
  if (ecosystem !== "python") return [];
  if (pythonMl !== undefined) return pythonMl;

  const response = await navigableMultiselect<PythonMl>({
    message: "Select ML capability packs",
    required: false,
    options: [
      {
        value: "scikit-learn" as const,
        label: "scikit-learn",
        hint: "Classic ML algorithms",
      },
      {
        value: "pytorch" as const,
        label: "PyTorch",
        hint: "Deep learning (surfaces the accelerator)",
      },
      { value: "tensorflow" as const, label: "TensorFlow", hint: "Deep learning framework" },
      { value: "jax" as const, label: "JAX", hint: "Composable transforms of numpy programs" },
      { value: "xgboost" as const, label: "XGBoost", hint: "Gradient boosting" },
      { value: "lightgbm" as const, label: "LightGBM", hint: "Fast gradient boosting" },
    ],
  });

  return cancelGuard(response);
}

export async function getPythonGenaiChoice(
  ecosystem: Ecosystem,
  pythonGenai?: PythonGenai[],
): Promise<PythonGenai[]> {
  if (ecosystem !== "python") return [];
  if (pythonGenai !== undefined) return pythonGenai;

  const response = await navigableMultiselect<PythonGenai>({
    message: "Select GenAI capability packs",
    required: false,
    validate: (selected) => {
      const exclusive = (selected ?? []).filter((p) => HEAVY_GENAI_EXCLUSIVE.includes(p));
      if (exclusive.length > 1) {
        return `Pick only one of vllm/unsloth/trl (got ${exclusive.join(", ")}).`;
      }
      return undefined;
    },
    options: [
      {
        value: "openai" as const,
        label: "OpenAI",
        hint: "Light HTTP client (composes with anything)",
      },
      {
        value: "anthropic" as const,
        label: "Anthropic",
        hint: "Light HTTP client (composes with anything)",
      },
      {
        value: "google-genai" as const,
        label: "Google GenAI",
        hint: "Light HTTP client (composes with anything)",
      },
      {
        value: "litellm" as const,
        label: "LiteLLM",
        hint: "Unified light client (composes with anything)",
      },
      {
        value: "transformers" as const,
        label: "Transformers",
        hint: "Heavy: owns the torch graph, needs a GPU",
      },
      {
        value: "vllm" as const,
        label: "vLLM",
        hint: "Heavy serve: conflicts with unsloth/trl",
      },
      {
        value: "unsloth" as const,
        label: "Unsloth",
        hint: "Heavy train: conflicts with vllm/trl",
      },
      { value: "trl" as const, label: "TRL", hint: "Heavy train: conflicts with vllm/unsloth" },
      {
        value: "peft" as const,
        label: "PEFT",
        hint: "Heavy: parameter-efficient fine-tuning",
      },
      {
        value: "accelerate" as const,
        label: "Accelerate",
        hint: "Heavy: distributed training helpers",
      },
    ],
  });

  return cancelGuard(response);
}

export async function getPythonAgentsChoice(
  ecosystem: Ecosystem,
  pythonAgents?: PythonAgents[],
): Promise<PythonAgents[]> {
  if (ecosystem !== "python") return [];
  if (pythonAgents !== undefined) return pythonAgents;

  const response = await navigableMultiselect<PythonAgents>({
    message: "Select agents capability packs",
    required: false,
    options: [
      { value: "langgraph" as const, label: "LangGraph", hint: "Stateful agent graphs" },
      { value: "openai-agents" as const, label: "OpenAI Agents", hint: "OpenAI Agents SDK" },
      {
        value: "claude-agent-sdk" as const,
        label: "Claude Agent SDK",
        hint: "Anthropic agent SDK",
      },
      {
        value: "pydantic-ai" as const,
        label: "Pydantic AI",
        hint: "Type-safe agent framework",
      },
      { value: "llamaindex" as const, label: "LlamaIndex", hint: "Data framework for agents" },
      { value: "crewai" as const, label: "CrewAI", hint: "Multi-agent orchestration" },
      {
        value: "autogen" as const,
        label: "AutoGen",
        hint: "Conversational multi-agent framework",
      },
    ],
  });

  return cancelGuard(response);
}

export async function getAcceleratorChoice(
  ecosystem: Ecosystem,
  accelerator?: Accelerator,
  pythonMl: PythonMl[] = [],
  pythonGenai: PythonGenai[] = [],
): Promise<Accelerator> {
  if (ecosystem !== "python") return "cpu";
  if (accelerator !== undefined) return accelerator;

  const hasHeavyGenai = pythonGenai.some((pack) => HEAVY_GENAI_PACKS.includes(pack));
  const hasTorchPack = pythonMl.includes("pytorch") || hasHeavyGenai;

  // The accelerator only wires torch wheels, so there is nothing to choose
  // unless a torch-based pack was selected.
  if (!hasTorchPack) return "cpu";

  // Heavy GenAI packs are invalid on cpu (validatePythonConstraints), so cpu is
  // dropped from the options and a GPU index becomes the default.
  const options: Array<{ value: Accelerator; label: string; hint: string }> = [];
  if (!hasHeavyGenai) {
    options.push({
      value: "cpu" as const,
      label: "CPU",
      hint: "Default PyPI wheels (no explicit index)",
    });
  }
  options.push(
    { value: "cu121" as const, label: "CUDA 12.1", hint: "Linux-gated CUDA 12.1 torch wheels" },
    { value: "cu124" as const, label: "CUDA 12.4", hint: "Linux-gated CUDA 12.4 torch wheels" },
    { value: "rocm" as const, label: "ROCm", hint: "Linux-gated AMD ROCm torch wheels" },
  );

  const response = await navigableSelect<Accelerator>({
    message: "Select compute accelerator",
    options,
    initialValue: hasHeavyGenai ? "cu124" : "cpu",
  });

  return cancelGuard(response);
}

export async function getPythonStarterChoice(
  ecosystem: Ecosystem,
  pythonStarter?: boolean,
): Promise<boolean> {
  if (ecosystem !== "python") return false;
  if (pythonStarter !== undefined) return pythonStarter;

  const response = await navigableConfirm({
    message: "Emit per-pack starter modules (train.py / serve.py / agent.py)?",
    initialValue: false,
  });

  return cancelGuard(response);
}
