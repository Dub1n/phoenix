---
tags: [template, wearos, android, project_structure]
provides: [wearos_structure_template]
requires: [meta/dss_config.yml]
---

# WearOS Project Structure Template

This template provides DSS-compliant organization for Android WearOS projects based on installation report feedback.

## Recommended Directory Structure

```
project-name-dss/
├── src/
│   ├── wear/                    # WearOS app module
│   │   ├── main/
│   │   │   ├── java/           # Kotlin/Java source
│   │   │   ├── res/            # WearOS resources
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── mobile/                  # Companion mobile app
│   │   ├── main/
│   │   │   ├── java/
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   └── shared/                  # Shared code/data layer
│       ├── communication/       # Watch-phone sync
│       ├── models/             # Data models
│       └── utils/              # Common utilities
├── docs/
│   ├── wearos/
│   │   ├── deployment.md       # WearOS deployment guide
│   │   ├── development-setup.md # Development environment
│   │   ├── watch-faces.md      # Watch face development
│   │   ├── complications.md    # Complication development
│   │   └── tiles.md           # Tile development
│   ├── templates/
│   │   ├── complication-template.kt
│   │   ├── watchface-template.kt
│   │   └── tile-template.kt
│   └── architecture/
│       ├── data-sync.md        # Watch-phone communication
│       └── mvvm-patterns.md    # WearOS MVVM architecture
├── tests/
│   ├── wearos/
│   │   ├── unit/               # Unit tests for WearOS
│   │   ├── integration/        # Integration tests
│   │   └── emulator/           # Emulator configurations
│   ├── mobile/                 # Mobile app tests
│   └── shared/                 # Shared code tests
├── data/
│   ├── sample-watchfaces/      # Sample watch face assets
│   ├── complications-data/     # Test data for complications
│   └── tile-configs/          # Tile configuration samples
└── meta/
    ├── gradle/                 # Gradle configuration
    ├── wearos-config.yml      # WearOS-specific settings
    └── build-scripts/         # Build automation
```

## Key WearOS Development Considerations

### 1. Module Organization
- **Separate modules** for wear and mobile apps to maintain clear boundaries
- **Shared module** for common code and data synchronization logic
- **Independent builds** allowing development of wear-only or mobile-only features

### 2. Data Synchronization
- Implement data layer API in `src/shared/communication/`
- Use MessageClient for simple data exchange
- Use DataClient for synchronized data storage
- Handle connectivity limitations gracefully

### 3. WearOS-Specific Features

#### Watch Faces
- Store in `src/wear/watchfaces/`
- Template available in `docs/templates/watchface-template.kt`
- Consider battery optimization and ambient mode

#### Complications
- Organize by type in `src/wear/complications/`
- Implement data providers for different complication types
- Test with various watch face combinations

#### Tiles
- Store in `src/wear/tiles/`
- Keep interactions simple and touch-friendly
- Optimize for quick glance interactions

### 4. Testing Strategy
- **Unit tests**: Focus on business logic and data transformations
- **Integration tests**: Test watch-phone communication
- **Emulator tests**: Use WearOS emulator configurations in `tests/wearos/emulator/`

## Windows Development Environment Setup

Based on installation report feedback for Windows users:

### Prerequisites
1. **Android Studio** with WearOS support
2. **WearOS emulator** or physical device
3. **Gradle** configured for multi-module builds
4. **ADB** properly configured for device communication

### Common Windows Issues & Solutions

#### Path Length Limitations
```yaml
# In meta/wearos-config.yml
build:
  gradle_opts: "-Dfile.encoding=UTF-8"
  output_dir: "build"  # Keep paths short
```

#### Console Output Issues
- Use Android Studio terminal instead of Windows Command Prompt
- Set `JAVA_OPTS=-Dfile.encoding=UTF-8` for proper Unicode handling

#### Emulator Performance
- Enable Hyper-V if available
- Allocate sufficient RAM for WearOS emulator
- Use hardware acceleration when possible

## Sample Configuration Files

### meta/wearos-config.yml
```yaml
# WearOS Project Configuration
project:
  name: "WearOS Application"
  min_sdk: 26  # WearOS 2.0+
  target_sdk: 33
  
modules:
  wear:
    type: "com.android.application"
    features:
      - "android.hardware.type.watch"
  mobile:
    type: "com.android.application"
    companion_for: "wear"
  shared:
    type: "com.android.library"

dependencies:
  wearos:
    - "androidx.wear:wear:1.3.0"
    - "com.google.android.support:wearable:2.9.0"
  communication:
    - "com.google.android.gms:play-services-wearable:18.0.0"
```

### Sample Gradle Module Structure
```gradle
// src/wear/build.gradle
android {
    compileSdk 33
    
    defaultConfig {
        applicationId "com.example.wearos"
        minSdk 26
        targetSdk 33
    }
    
    buildFeatures {
        viewBinding true
    }
}

dependencies {
    implementation project(':shared')
    implementation 'androidx.wear:wear:1.3.0'
    compileOnly 'com.google.android.wearable:wearable:2.9.0'
}
```

## DSS Integration Notes

- This structure follows DSS conventions while optimizing for WearOS development
- Documentation is centralized in `docs/` with WearOS-specific guidance
- Tests are organized by module but follow DSS patterns
- Configuration files in `meta/` support build automation
- Sample data in `data/` supports development and testing

## Getting Started Checklist

- [ ] Set up Android Studio with WearOS SDK
- [ ] Configure emulator or connect physical WearOS device
- [ ] Create wear, mobile, and shared modules following structure above
- [ ] Implement basic data synchronization between modules
- [ ] Set up testing framework for each module
- [ ] Configure build scripts in `meta/build-scripts/`
- [ ] Document any Windows-specific setup issues encountered

---

*This template addresses common issues found in installation reports for WearOS projects on Windows platforms.* 