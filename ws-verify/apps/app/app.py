import streamlit as st

st.title("ws-verify")
st.write("Welcome to your Streamlit app, scaffolded with Better-T-Stack.")

name = st.text_input("What is your name?", value="world")
st.write(f"Hello, {name}!")
