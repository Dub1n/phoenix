---
tags: [automation, formatting, dss-converter, architecture, guide]
provides: [dss_autoformatter_design, conversion_strategy, implementation_guide]
requires: [meta/dss_config.yml, meta/scripts/convert_to_dss.py]
---

# DSS Auto-Formatter: Comprehensive Design & Implementation Guide

> **Mission** – Design and implement a robust, intelligent auto-formatter that can transform any repository into a clean, LLM-optimized DSS structure while preserving developer intent and minimizing disruption.

---

## 1  Vision & Design Philosophy

### 1.1  Core Objectives

The DSS auto-formatter should be:

* **Minimally invasive** – Preserve existing code structure and developer workflows
* **Intelligent** – Use LLM assistance for ambiguous classification decisions
* **Reversible** – Maintain enough metadata to undo transformations if needed
* **Incremental** – Support partial conversion and iterative improvement
* **Configurable** – Adapt to different project types and organizational standards

### 1.2  Design Principles

1. **Structure over destruction** – Move and organize rather than rewrite
2. **Metadata preservation** – Maintain git history, file timestamps, and authorship
3. **Convention inference** – Learn from existing patterns before imposing new ones
4. **Human-in-the-loop** – Prompt for decisions on ambiguous cases
5. **Fail-safe defaults** – When uncertain, choose the most reversible option

---

## 2  Architecture Overview

### 2.1  Multi-Phase Processing Pipeline

```text
Phase 1: DISCOVERY        → Analyze existing structure, patterns, dependencies
Phase 2: CLASSIFICATION   → Categorize files using rules + LLM assistance  
Phase 3: PLANNING         → Generate transformation plan with conflict resolution
Phase 4: EXECUTION        → Apply changes with rollback capability
Phase 5: ENHANCEMENT      → Add metadata, generate docs, optimize structure
Phase 6: VALIDATION       → Verify integrity and suggest improvements
```

### 2.2  Component Architecture

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discovery     │    │  Classification │    │    Planning     │
│   Engine        │───▶│     Engine      │───▶│     Engine      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Execution     │    │   Enhancement   │    │   Validation    │
│   Engine        │───▶│     Engine      │───▶│     Engine      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## 3  Phase 1: Discovery Engine

### 3.1  Repository Analysis

**Structural Discovery:**
```python
class RepositoryAnalyzer:
    def analyze_structure(self, repo_path: Path) -> RepoStructure:
        """Comprehensive repository analysis."""
        return RepoStructure(
            # File organization patterns
            folder_hierarchy=self._analyze_folders(),
            file_distributions=self._analyze_file_types(),
            naming_conventions=self._infer_naming_patterns(),
            
            # Code structure
            dependencies=self._extract_dependencies(),
            imports=self._analyze_import_patterns(),
            entry_points=self._find_entry_points(),
            
            # Documentation patterns
            readme_locations=self._find_documentation(),
            doc_formats=self._analyze_doc_patterns(),
            
            # Development infrastructure
            build_systems=self._detect_build_tools(),
            ci_configs=self._find_ci_files(),
            test_patterns=self._analyze_test_structure()
        )
```

**Pattern Recognition:**
* Detect existing organizational patterns (e.g., `lib/`, `scripts/`, `notebooks/`)
* Identify test frameworks and conventions
* Map dependency relationships and module boundaries
* Recognize documentation hierarchies and cross-references

**Conflict Detection:**
* Files that could belong to multiple DSS categories
* Circular dependencies that might complicate reorganization
* Build scripts that hardcode paths
* External tools that expect specific file locations

### 3.2  Existing Convention Inference

```python
class ConventionAnalyzer:
    def infer_conventions(self, files: List[Path]) -> ProjectConventions:
        """Learn from existing patterns before imposing new ones."""
        return ProjectConventions(
            naming_style=self._detect_naming_style(),  # snake_case, kebab-case, etc.
            doc_format=self._detect_doc_format(),      # .md, .rst, .txt preferences
            test_patterns=self._detect_test_patterns(), # test_*, *_test.py, tests/
            config_patterns=self._detect_config_style() # .yml, .json, .toml preferences
        )
```

---

## 4  Phase 2: Classification Engine

### 4.1  Multi-Tier Classification Strategy

**Tier 1: Rule-Based Classification**
```yaml
# Extended dss_config.yml classification rules
classification_rules:
  explicit_patterns:
    src:
      - "**/*.py"
      - "**/*.js"
      - "**/*.ts"
      - "**/src/**"
      - "**/lib/**"
    data:
      - "**/*.csv"
      - "**/*.parquet"
      - "**/*.json"
      - "**/data/**"
      - "**/datasets/**"
    docs:
      - "**/*.md"
      - "**/*.rst"
      - "**/docs/**"
      - "**/documentation/**"
    tests:
      - "**/test_*.py"
      - "**/*_test.py"
      - "**/tests/**"
      - "**/spec/**"

  exclusion_patterns:
    - "**/.git/**"
    - "**/node_modules/**"
    - "**/__pycache__/**"
    - "**/.*"  # hidden files (unless explicitly included)

  ambiguous_patterns:
    # Files that need LLM or human classification
    - "**/*.ipynb"  # Could be src, docs, or data analysis
    - "**/*.sql"    # Could be src or data
    - "**/*.yml"    # Could be config, CI, or data
```

**Tier 2: Content-Based Classification**
```python
class ContentClassifier:
    def classify_by_content(self, file_path: Path) -> Classification:
        """Analyze file content for classification hints."""
        content = file_path.read_text()
        
        # Heuristics for ambiguous files
        if file_path.suffix == '.py':
            if self._contains_main_function(content):
                return Classification.EXECUTABLE_SRC
            elif self._contains_test_patterns(content):
                return Classification.TESTS
            elif self._is_config_file(content):
                return Classification.META
                
        elif file_path.suffix == '.ipynb':
            if self._is_analysis_notebook(content):
                return Classification.DATA_ANALYSIS
            elif self._is_documentation_notebook(content):
                return Classification.DOCS
                
        return Classification.AMBIGUOUS
```

**Tier 3: LLM-Assisted Classification**
```python
class LLMClassifier:
    def classify_ambiguous_files(self, files: List[Path]) -> Dict[Path, Classification]:
        """Use LLM for files that can't be classified by rules."""
        prompt = self._build_classification_prompt(files)
        response = self.llm_client.complete(prompt)
        return self._parse_classification_response(response)
        
    def _build_classification_prompt(self, files: List[Path]) -> str:
        return f"""
        Classify these files into DSS categories (src/data/docs/meta/tests):
        
        Files to classify:
        {self._format_file_context(files)}
        
        Consider:
        - File content and purpose
        - Project context and patterns
        - DSS organizational principles
        
        Respond with: filename -> category, confidence_score, reasoning
        """
```

### 4.2  Dependency-Aware Classification

```python
class DependencyClassifier:
    def classify_by_dependencies(self, file_graph: FileGraph) -> ClassificationUpdates:
        """Refine classifications based on dependency relationships."""
        
        # Files imported by tests should often be in src/
        # Files that only consume data should be in analysis/
        # Files that generate data should be in src/
        
        updates = []
        for file_node in file_graph.nodes:
            if file_node.classification == Classification.AMBIGUOUS:
                # Analyze import/dependency patterns
                if self._is_primarily_imported_by_tests(file_node):
                    updates.append((file_node.path, Classification.SRC))
                elif self._generates_artifacts(file_node):
                    updates.append((file_node.path, Classification.SRC))
                elif self._is_pure_analysis(file_node):
                    updates.append((file_node.path, Classification.DATA_ANALYSIS))
                    
        return updates
```

---

## 5  Phase 3: Planning Engine

### 5.1  Transformation Planning

```python
class TransformationPlanner:
    def create_plan(self, analysis: RepoStructure, classifications: Classifications) -> TransformationPlan:
        """Generate a comprehensive transformation plan."""
        
        plan = TransformationPlan()
        
        # 1. File movements and reorganization
        plan.file_moves = self._plan_file_movements(classifications)
        
        # 2. Directory structure creation
        plan.directory_creation = self._plan_directory_structure()
        
        # 3. Metadata injection
        plan.metadata_injection = self._plan_metadata_injection(classifications)
        
        # 4. Configuration updates
        plan.config_updates = self._plan_config_updates(analysis)
        
        # 5. Documentation generation
        plan.doc_generation = self._plan_documentation_generation()
        
        # 6. Conflict resolution
        plan.conflicts = self._identify_conflicts(plan)
        
        return plan
```

**Conflict Resolution Strategies:**
```python
class ConflictResolver:
    def resolve_conflicts(self, conflicts: List[Conflict]) -> List[Resolution]:
        """Intelligent conflict resolution with user input when needed."""
        
        resolutions = []
        for conflict in conflicts:
            if conflict.type == ConflictType.NAMING_COLLISION:
                resolution = self._resolve_naming_collision(conflict)
            elif conflict.type == ConflictType.AMBIGUOUS_CLASSIFICATION:
                resolution = self._resolve_classification_ambiguity(conflict)
            elif conflict.type == ConflictType.DEPENDENCY_CYCLE:
                resolution = self._resolve_dependency_cycle(conflict)
            else:
                resolution = self._request_user_input(conflict)
                
            resolutions.append(resolution)
            
        return resolutions
```

### 5.2  Risk Assessment & Rollback Planning

```python
class RiskAssessor:
    def assess_transformation_risks(self, plan: TransformationPlan) -> RiskAssessment:
        """Evaluate potential risks and plan mitigation strategies."""
        
        risks = []
        
        # High-risk transformations
        if plan.breaks_existing_imports():
            risks.append(Risk.BROKEN_IMPORTS)
        if plan.moves_entry_points():
            risks.append(Risk.BROKEN_EXECUTION)
        if plan.affects_ci_scripts():
            risks.append(Risk.BROKEN_CI)
            
        # Generate rollback plan
        rollback_plan = self._create_rollback_plan(plan)
        
        return RiskAssessment(risks=risks, rollback_plan=rollback_plan)
```

---

## 6  Phase 4: Execution Engine

### 6.1  Safe Transformation Execution

```python
class TransformationExecutor:
    def execute_plan(self, plan: TransformationPlan) -> ExecutionResult:
        """Execute transformation plan with safety checks and rollback capability."""
        
        # Create git checkpoint
        checkpoint = self._create_git_checkpoint()
        
        try:
            # Execute in dependency order
            for step in plan.ordered_steps():
                self._execute_step(step)
                self._validate_step(step)
                
            return ExecutionResult.SUCCESS
            
        except TransformationError as e:
            # Automatic rollback on failure
            self._rollback_to_checkpoint(checkpoint)
            return ExecutionResult.FAILED(error=e)
```

**Step-by-Step Execution:**
1. **Pre-execution validation** – Check write permissions, disk space, dependencies
2. **Incremental execution** – Apply changes in small, validatable chunks
3. **Continuous validation** – Verify each step before proceeding
4. **Progress tracking** – Provide detailed feedback on transformation progress
5. **Error recovery** – Graceful handling of failures with partial rollback

### 6.2  Import and Reference Updates

```python
class ReferenceUpdater:
    def update_all_references(self, file_moves: List[FileMove]) -> UpdateResult:
        """Update all references to moved files."""
        
        updates = []
        
        # Update Python imports
        updates.extend(self._update_python_imports(file_moves))
        
        # Update configuration paths
        updates.extend(self._update_config_paths(file_moves))
        
        # Update documentation links
        updates.extend(self._update_doc_links(file_moves))
        
        # Update CI/CD scripts
        updates.extend(self._update_ci_scripts(file_moves))
        
        return UpdateResult(updates)
```

---

## 7  Phase 5: Enhancement Engine

### 7.1  Metadata Injection Strategy

```python
class MetadataInjector:
    def inject_comprehensive_metadata(self, files: List[Path]) -> InjectionResult:
        """Add rich metadata to all files in DSS format."""
        
        for file_path in files:
            metadata = self._generate_metadata(file_path)
            
            # Inject based on file type
            if file_path.suffix == '.py':
                self._inject_python_metadata(file_path, metadata)
            elif file_path.suffix == '.md':
                self._inject_markdown_metadata(file_path, metadata)
            elif file_path.suffix == '.ipynb':
                self._inject_notebook_metadata(file_path, metadata)
                
    def _generate_metadata(self, file_path: Path) -> FileMetadata:
        """Generate intelligent metadata based on file analysis."""
        
        # Analyze file content and dependencies
        content_analysis = self._analyze_file_content(file_path)
        dependencies = self._extract_file_dependencies(file_path)
        
        return FileMetadata(
            tags=self._generate_tags(content_analysis),
            provides=self._identify_exports(content_analysis),
            requires=self._identify_imports(dependencies),
            description=self._generate_description(content_analysis),
            created=file_path.stat().st_ctime,
            modified=file_path.stat().st_mtime
        )
```

### 7.2  Intelligent Documentation Generation

```python
class DocumentationGenerator:
    def generate_comprehensive_docs(self, dss_structure: DSSStructure) -> DocGenerationResult:
        """Generate documentation using LLM assistance."""
        
        # Generate folder-level READMEs
        for folder in dss_structure.folders:
            readme_content = self._generate_folder_readme(folder)
            self._write_readme(folder.path / "README.md", readme_content)
            
        # Generate module documentation
        for module in dss_structure.python_modules:
            doc_content = self._generate_module_docs(module)
            self._write_module_docs(module, doc_content)
            
        # Generate project INDEX.md
        index_content = self._generate_project_index(dss_structure)
        self._write_index(dss_structure.root / "INDEX.md", index_content)
        
        # Generate visualization canvases
        if self.config.generate_canvases:
            canvas_json = self._generate_structure_canvas(dss_structure)
            self._write_canvas(dss_structure.canvas_dir / "structure.canvas", canvas_json)
```

---

## 8  Phase 6: Validation Engine

### 8.1  Comprehensive Validation

```python
class ValidationEngine:
    def validate_transformation(self, original: RepoStructure, transformed: DSSStructure) -> ValidationResult:
        """Comprehensive validation of the transformation."""
        
        validation_results = []
        
        # Structural validation
        validation_results.append(self._validate_structure(transformed))
        
        # Functional validation
        validation_results.append(self._validate_functionality(original, transformed))
        
        # Metadata validation
        validation_results.append(self._validate_metadata(transformed))
        
        # Integration validation
        validation_results.append(self._validate_integrations(transformed))
        
        return ValidationResult.combine(validation_results)
        
    def _validate_functionality(self, original: RepoStructure, transformed: DSSStructure) -> FunctionalValidation:
        """Ensure functionality is preserved after transformation."""
        
        # Test that imports still work
        import_validation = self._test_imports(transformed)
        
        # Test that entry points still execute
        execution_validation = self._test_execution(transformed)
        
        # Test that tests still pass
        test_validation = self._run_test_suite(transformed)
        
        return FunctionalValidation.combine([
            import_validation, 
            execution_validation, 
            test_validation
        ])
```

### 8.2  Quality Metrics & Reporting

```python
class QualityReporter:
    def generate_transformation_report(self, validation: ValidationResult) -> TransformationReport:
        """Generate comprehensive report on transformation quality."""
        
        return TransformationReport(
            # Transformation metrics
            files_moved=validation.files_moved,
            files_created=validation.files_created,
            metadata_injected=validation.metadata_injected,
            
            # Quality metrics
            structure_compliance=validation.structure_score,
            metadata_completeness=validation.metadata_score,
            documentation_coverage=validation.documentation_score,
            
            # Issues and recommendations
            warnings=validation.warnings,
            errors=validation.errors,
            recommendations=self._generate_recommendations(validation)
        )
```

---

## 9  Configuration & Customization

### 9.1  Extended Configuration Schema

```yaml
# dss_autoformatter_config.yml
formatter_config:
  # Transformation behavior
  transformation:
    preserve_git_history: true
    create_backup: true
    incremental_mode: false
    dry_run: false
    
  # Classification settings
  classification:
    use_llm_for_ambiguous: true
    confidence_threshold: 0.8
    human_review_required: false
    
  # File handling
  file_handling:
    preserve_timestamps: true
    update_imports: true
    fix_relative_paths: true
    
  # Metadata generation
  metadata:
    auto_generate_tags: true
    analyze_dependencies: true
    include_descriptions: true
    
  # Documentation generation
  documentation:
    generate_readmes: true
    create_index: true
    generate_canvases: false
    
  # Custom rules
  custom_rules:
    naming_conventions:
      python_files: "snake_case"
      doc_files: "kebab-case"
    
    special_handling:
      - pattern: "**/migrations/**"
        category: "data"
        preserve_structure: true
      - pattern: "**/fixtures/**"
        category: "tests"
        
  # Integration settings
  integrations:
    pre_commit_hooks: true
    ci_cd_updates: true
    ide_config_updates: false
```

### 9.2  Plugin Architecture

```python
class FormatterPlugin:
    """Base class for formatter plugins."""
    
    def should_handle(self, file_path: Path) -> bool:
        """Return True if this plugin should handle the file."""
        raise NotImplementedError
        
    def classify(self, file_path: Path) -> Classification:
        """Classify the file."""
        raise NotImplementedError
        
    def transform(self, file_path: Path, target_dir: Path) -> TransformationResult:
        """Transform the file."""
        raise NotImplementedError

# Example plugins
class JupyterNotebookPlugin(FormatterPlugin):
    """Specialized handling for Jupyter notebooks."""
    pass

class DockerPlugin(FormatterPlugin):
    """Specialized handling for Docker configurations."""
    pass

class WebFrameworkPlugin(FormatterPlugin):
    """Specialized handling for web framework projects."""
    pass
```

---

## 10  Advanced Features & Future Enhancements

### 10.1  Intelligent Pattern Learning

```python
class PatternLearner:
    def learn_organizational_patterns(self, repo_histories: List[RepoHistory]) -> OrganizationalPatterns:
        """Learn optimal organizational patterns from successful transformations."""
        
        # Analyze patterns that led to successful outcomes
        successful_patterns = self._extract_successful_patterns(repo_histories)
        
        # Use ML to identify optimal classification rules
        learned_rules = self._train_classification_model(successful_patterns)
        
        return OrganizationalPatterns(
            classification_rules=learned_rules,
            naming_conventions=self._extract_naming_patterns(successful_patterns),
            structure_preferences=self._extract_structure_patterns(successful_patterns)
        )
```

### 10.2  Continuous Optimization

```python
class ContinuousOptimizer:
    def optimize_repository_structure(self, dss_repo: DSSRepository) -> OptimizationSuggestions:
        """Continuously suggest improvements to repository structure."""
        
        # Analyze usage patterns
        usage_analysis = self._analyze_file_usage(dss_repo)
        
        # Identify improvement opportunities
        suggestions = []
        
        if usage_analysis.has_unused_files():
            suggestions.append(self._suggest_archive_cleanup())
            
        if usage_analysis.has_circular_dependencies():
            suggestions.append(self._suggest_dependency_refactoring())
            
        if usage_analysis.has_naming_inconsistencies():
            suggestions.append(self._suggest_naming_improvements())
            
        return OptimizationSuggestions(suggestions)
```

---

## 11  Implementation Roadmap

### 11.1  Development Phases

**Phase 1: Core Infrastructure (Weeks 1-2)**
- [ ] Repository analysis engine
- [ ] Basic file classification
- [ ] Simple transformation planning
- [ ] Safe execution with rollback

**Phase 2: Intelligence Layer (Weeks 3-4)**
- [ ] LLM-assisted classification
- [ ] Dependency analysis
- [ ] Conflict resolution
- [ ] Metadata generation

**Phase 3: Enhancement Features (Weeks 5-6)**
- [ ] Documentation generation
- [ ] Comprehensive validation
- [ ] Quality reporting
- [ ] Configuration system

**Phase 4: Advanced Features (Weeks 7-8)**
- [ ] Plugin architecture
- [ ] Pattern learning
- [ ] Continuous optimization
- [ ] Integration tools

### 11.2  Success Metrics

**Transformation Quality:**
- 95%+ functional preservation (imports, tests, execution)
- 90%+ metadata completeness
- 85%+ structure compliance

**User Experience:**
- <5 minutes for typical repository transformation
- <3 user interventions for ambiguous cases
- Zero data loss incidents

**Ecosystem Integration:**
- Compatible with 90%+ of Python project structures
- Seamless git workflow integration
- CI/CD pipeline compatibility

---

## 12  Conclusion

The DSS auto-formatter represents a sophisticated approach to repository transformation that combines rule-based logic, LLM intelligence, and human oversight to create optimal organizational structures. By following this comprehensive design, we can build a tool that not only transforms repositories but continuously improves them, making codebases more accessible to both humans and AI systems.

The key to success lies in the multi-phase approach that prioritizes safety, intelligence, and user experience while maintaining the flexibility to handle diverse project types and organizational requirements.

> *This document serves as the definitive guide for implementing the DSS auto-formatter. As development progresses, specific implementation details should be added to maintain this as a living architectural document.*
