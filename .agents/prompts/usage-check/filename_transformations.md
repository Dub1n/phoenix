---
tags: [documentation, reference, naming, ai_interaction]
provides: [filename_transformation_examples]
requires: [meta/guidelines/naming_conventions.md]
---

# LLM-Optimized Filename Transformations

This document provides comprehensive examples of filename transformations following the [LLM-Optimized Naming Conventions](mdc:meta/guidelines/naming_conventions.md). Use these examples as a reference when naming new files or renaming existing ones.

## Python Files

|  Before        |  After                          |  Improvement                              |
| -------------- | ------------------------------- | ----------------------------------------- |
|  `utils.py`    |  `string_utils.py`              |  Specifies the type of utilities          |
|  `helpers.py`  |  `date_formatting_helpers.py`   |  Clarifies the specific helper functions  |
|  `main.py`     |  `application_entry.py`         |  More descriptive of the file's role      |
|  `db.py`       |  `database_connection.py`       |  Explicit rather than abbreviated         |
|  `process.py`  |  `data_processing_pipeline.py`  |  Describes what is being processed        |
|  `api.py`      |  `rest_api_endpoints.py`        |  Specifies the type of API                |
|  `auth.py`     |  `user_authentication.py`       |  Fully descriptive of functionality       |
|  `calc.py`     |  `financial_calculations.py`    |  Domain-specific description              |
|  `models.py`   |  `data_models.py`               |  Clarifies the type of models             |
|  `exc.py`      |  `custom_exceptions.py`         |  Avoids abbreviation                      |

## Documentation Files

|  Before          |  After                                 |  Improvement                            |
| ---------------- | -------------------------------------- | --------------------------------------- |
|  `README.md`     |  `project_overview.md`                 |  More specific about content            |
|  `info.md`       |  `system_architecture.md`              |  Clearly states the document's content  |
|  `howto.md`      |  `how_to_deploy_application.md`        |  Specific action being documented       |
|  `notes.md`      |  `development_guidelines.md`           |  Purpose-driven naming                  |
|  `docs.md`       |  `api_documentation.md`                |  Specifies the type of documentation    |
|  `setup.md`      |  `environment_setup_guide.md`          |  Comprehensive description              |
|  `guide.md`      |  `user_onboarding_guide.md`            |  Targeted audience and purpose          |
|  `reference.md`  |  `configuration_options_reference.md`  |  Specific reference content             |
|  `tutorial.md`   |  `data_import_tutorial.md`             |  Specifies the tutorial subject         |
|  `overview.md`   |  `feature_overview.md`                 |  Clarifies what is being overviewed     |

## Configuration Files

|  Before            |  After                               |  Improvement                     |
| ------------------ | ------------------------------------ | -------------------------------- |
|  `config.json`     |  `database_config.json`              |  Indicates the scope             |
|  `settings.yml`    |  `application_settings.yml`          |  Clarifies the settings context  |
|  `.env`            |  `.env.development`                  |  Specifies the environment       |
|  `defaults.json`   |  `default_user_preferences.json`     |  Explicit about what defaults    |
|  `params.json`     |  `machine_learning_parameters.json`  |  Domain-specific parameters      |
|  `options.yml`     |  `logging_options.yml`               |  Purpose-specific options        |
|  `schema.json`     |  `data_validation_schema.json`       |  Functional description          |
|  `rules.yml`       |  `content_filtering_rules.yml`       |  Clarifies rule purpose          |
|  `constants.json`  |  `application_constants.json`        |  Scope of constants              |
|  `vars.env`        |  `database_variables.env`            |  Specific variables context      |

## Scripts and Automation

|  Before        |  After                             |  Improvement                     |
| -------------- | ---------------------------------- | -------------------------------- |
|  `script.py`   |  `data_import_script.py`           |  Describes the script's purpose  |
|  `build.sh`    |  `docker_image_build.sh`           |  Specific build target           |
|  `deploy.sh`   |  `kubernetes_deployment.sh`        |  Deployment platform specified   |
|  `run.py`      |  `run_background_tasks.py`         |  What is being run               |
|  `setup.sh`    |  `developer_environment_setup.sh`  |  Detailed purpose                |
|  `clean.py`    |  `database_cleanup_script.py`      |  What is being cleaned           |
|  `migrate.py`  |  `schema_migration_tool.py`        |  Migration purpose               |
|  `check.sh`    |  `security_compliance_check.sh`    |  Type of check being performed   |
|  `update.py`   |  `dependency_update_script.py`     |  Update target specified         |
|  `convert.py`  |  `csv_to_json_converter.py`        |  Source and destination formats  |

## Web Development Files

|  Before        |  After                               |  Improvement                      |
| -------------- | ------------------------------------ | --------------------------------- |
|  `app.js`      |  `frontend_application.js`           |  Clarifies it's the frontend app  |
|  `styles.css`  |  `dashboard_component_styles.css`    |  Component-specific styles        |
|  `index.html`  |  `main_landing_page.html`            |  Functional description           |
|  `form.jsx`    |  `UserRegistrationForm.jsx`          |  Specific form purpose            |
|  `api.ts`      |  `user_api_client.ts`                |  Client and domain specified      |
|  `util.js`     |  `form_validation_utilities.js`      |  Purpose-specific utilities       |
|  `types.ts`    |  `data_model_types.ts`               |  Domain of the types              |
|  `hooks.js`    |  `authentication_hooks.js`           |  Functionality of hooks           |
|  `routes.js`   |  `application_route_definitions.js`  |  Comprehensive description        |
|  `store.ts`    |  `global_state_store.ts`             |  Clarifies store purpose          |

## Directory Names

|  Before     |  After              |  Improvement                           |
| ----------- | ------------------- | -------------------------------------- |
|  `lib/`     |  `libraries/`       |  Full word is more discoverable        |
|  `src/`     |  `source/`          |  Complete word (though src is common)  |
|  `docs/`    |  `documentation/`   |  Full word (though docs is common)     |
|  `impl/`    |  `implementation/`  |  Avoids abbreviation                   |
|  `ui/`      |  `user_interface/`  |  Expanded abbreviation                 |
|  `utils/`   |  `utilities/`       |  Complete word                         |
|  `auth/`    |  `authentication/`  |  Domain-specific full term             |
|  `config/`  |  `configuration/`   |  Complete word                         |
|  `api/`     |  `api_endpoints/`   |  More specific about content           |
|  `db/`      |  `database/`        |  Explicit rather than abbreviated      |

## Test Files

|  Before           |  After                                |  Improvement                          |
| ----------------- | ------------------------------------- | ------------------------------------- |
|  `test.py`        |  `test_user_authentication.py`        |  Specific functionality being tested  |
|  `test_api.py`    |  `test_user_api_endpoints.py`         |  Narrows down the API scope           |
|  `test_utils.py`  |  `test_string_manipulation_utils.py`  |  Specific utilities being tested      |
|  `test_db.py`     |  `test_database_connection.py`        |  Explicit database aspect             |
|  `test_all.py`    |  `test_integration_all_modules.py`    |  Test type and scope                  |
|  `test_func.py`   |  `test_core_functions.py`             |  Clearer scope                        |
|  `test_unit.py`   |  `test_unit_calculations.py`          |  Specific units being tested          |
|  `test_e2e.py`    |  `test_end_to_end_workflow.py`        |  Full description of test type        |
|  `test_mock.py`   |  `test_service_mocks.py`              |  What is being mocked                 |
|  `test_perf.py`   |  `test_query_performance.py`          |  Performance aspect being tested      |

## Implementation Strategy

When implementing these naming conventions:

1. **Start with high-impact files**: Begin with files that are accessed frequently or are central to the project.
2. **Update in logical groups**: Rename related files together to maintain consistency.
3. **Update documentation and imports**: Ensure all references are updated after renaming.
4. **Use search and replace tools**: Automate the process where possible to avoid errors.
5. **Verify after changes**: Test the application after renaming to ensure nothing was broken.

Refer to the [LLM-Optimized Naming Conventions](mdc:meta/guidelines/naming_conventions.md) document for the full set of guidelines and principles behind these transformations.
