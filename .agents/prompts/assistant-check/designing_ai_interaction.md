---
tags: [documentation, ai_interaction]
provides: [designing_ai_interaction_guide]
requires: [assistant.mdc]
---

# Designing High-Level AI Interaction in DSS

This document outlines the principles and process for designing, documenting, and refining the high-level operational instructions for AI assistants within the Data SuperStructure (DSS) framework. The goal is to create a transparent, adaptable, and collaborative environment where AI behavior is explicitly defined and can evolve alongside the project.

## Purpose

Defining the AI's high-level interaction allows for:

* **Predictable Behavior:** Ensuring the AI acts consistently and in alignment with project conventions and goals.
* **Transparency:** Making the AI's operational guidelines visible and understandable to human collaborators.
* **Adaptability:** Providing a clear mechanism for updating AI behavior as workflows evolve or new needs arise.
* **Collaboration:** Enabling a shared understanding between humans and AI on how tasks should be approached and managed.

## Key Component: `assistant.mdc`

The `.cursor/rules/assistant.mdc` file is the primary location for defining the core operational instructions for the AI assistant within a DSS repository. It contains guidelines on:

* The AI's role and responsibilities (e.g., maintaining metadata, docs, canvases).
* Specific workflows to follow when performing tasks (e.g., updating roadmap, using TODO list).
* Project-specific conventions and rules (e.g., ignoring archive directories, adhering to the DSS Guide).
* Meta-instructions for the AI's own self-maintenance and learning.

## Process for Designing and Refining AI Instructions

The design of AI interaction in DSS is an iterative and collaborative process:

1. **Identify a need or desired behavior:** Recognize a task, workflow, or principle that should govern the AI's actions within the repository.
2. **Discuss and define the instruction:** Collaboratively (between human and AI, or among human team members) define the specific instruction that captures the desired behavior.
3. **Document the instruction in `assistant.mdc`:** Add the agreed-upon instruction to the relevant section of the `.cursor/rules/assistant.mdc` file. Use clear and concise language.
4. **Test and refine:** Observe the AI's behavior based on the new instruction. If discrepancies arise or the instruction is unclear or problematic, initiate a self-correction process.

## Self-Correction Mechanism

As defined in `assistant.mdc`, if an AI action does not align with established guidelines:

1. **Identify the discrepancy:** Recognize that the action deviated from the expected behavior.
2. **Determine the reason for the failure:** Analyze why the discrepancy occurred, including evaluating if the guideline itself is appropriate for the situation and aligns with DSS goals.
3. **Implement clear fixes:** If a solution is straightforward and directly corrects a missed step or obvious error, apply it immediately.
4. **Seek user guidance for complex issues:** If the analysis suggests the guideline is flawed, unclear, or if the correct path forward is uncertain, explain the situation to the user and ask for direction.
5. **Update instructions:** Based on the outcome of the analysis and any user guidance, update the instructions in `assistant.mdc` or other relevant documentation to prevent similar issues in the future.

This process ensures that the AI's operational instructions are living documentation, constantly improved based on real-world interaction and feedback, contributing to a more robust and effective AI collaboration within the DSS framework.
