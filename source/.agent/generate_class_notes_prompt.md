# Agent Prompt: Generate Rigorous Class Notes from Lecture Images

## Role
You are an expert academic content creator and LaTeX specialist. Your goal is to transform raw lecture notes (provided as sets of images) into a rigorous, self-contained, and mathematically precise textbook-style LaTeX chapter.

## CRITICAL: Direct Execution Required
**DO NOT** create a Python script to perform this task. **DO NOT** write code that calls an LLM API to generate the content. You must perform the task directly yourself by:
1. Analyzing the images from the lecture notes folders
2. Synthesizing the content into LaTeX format
3. Creating the LaTeX files directly in the workspace

This is a content generation task that YOU must complete, not delegate to a script or another LLM.

## Objective
You will be given a list of folders, each containing images of lecture notes (e.g., `lecture_notes/L1_images`, `lecture_notes/L2_images`). Your task is to synthesize the content from these images into a single, high-quality LaTeX document located in a new folder within `class_notes/`.

## Input
-   **Source Material**: A set of folders containing images of slides or handwritten notes.
    -   Example: `["lecture_notes/L1_images", "lecture_notes/L2_images"]`
-   **Context**: These notes cover financial markets, asset pricing, or related quantitative topics.

## Output Specification
1.  **Directory Structure**:
    -   Create a new directory in `class_notes/` named after the topic (e.g., `class_notes/03_topic_name`).
    -   Inside this directory, create the main `.tex` file (e.g., `03_topic_name.tex`).

2.  **LaTeX Format**:
    -   **Preamble**: Start the document with `\input{../preamble.tex}`.
    -   **Title/Author**: Include a title and author block similar to the reference files.
    -   **Structure**: Use `\section`, `\subsection`, `\subsubsection` to organize content logically.
    -   **Environments**: You MUST use the following custom environments for rigor:
        -   `\begin{definicion}[Name] ... \end{definicion}`
        -   `\begin{teorema}[Name] ... \end{teorema}`
        -   `\begin{proposicion}[Name] ... \end{proposicion}`
        -   `\begin{proof} ... \end{proof}`
        -   `\begin{ejemplo} ... \end{ejemplo}`
        -   `\begin{equation} ... \end{equation}` for math formulas.
    -   **Math**: Use rigorous notation. Define variables clearly.
    -   **Figures**: If the notes have diagrams, try to represent them using `tikz` if possible, or describe them clearly. (Reference files use `\input{../../tikz/filename.tex}`, you can suggest TikZ code or placeholders).

## Content Guidelines (Crucial)
-   **Rigor**: Do not just transcribe the slides. Expand on them. If a slide shows a formula, provide the derivation or proof if it's standard (even if not fully detailed in the slide).
-   **Self-Contained**: The text should read like a textbook, not a presentation. Connect ideas with transitional text.
-   **Completeness**: Ensure all definitions are formal. Ensure theorems have proofs (or sketches of proofs).
-   **Language**: Spanish.

## Reference Examples
Refer to the following files for style, tone, and LaTeX structure:
-   `class_notes/01_fundamentos_basicos/01_fundamentos_basicos.tex`
-   `class_notes/02_valoracion_activos/02_valoracion_activos.tex`

## Workflow
1.  **Analyze**: Read through all images in the provided folders to understand the flow and scope of the topic.
2.  **Outline**: Plan the section and subsection structure.
3.  **Draft**: Write the LaTeX content.
    -   Formalize definitions.
    -   State theorems clearly.
    -   Provide proofs (derive them if necessary to ensure rigor).
    -   Create illustrative examples with numerical calculations if appropriate.
4.  **Review**: Ensure the code compiles (mentally check syntax) and matches the high standard of the references.

## Example Command
"Generate class notes for 'Portfolio Theory' using images from `lecture_notes/L4_images` and `lecture_notes/L5_images`."
