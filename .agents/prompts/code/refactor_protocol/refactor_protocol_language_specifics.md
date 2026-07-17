# Refactor Protocol Language-Specific Patterns

**Purpose**: Language-specific refactoring patterns and best practices for the Self-Executing Refactor Protocol  
**Usage**: Reference this file when you need language-specific refactoring guidance or patterns  
**Related**: [Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)

---

## 🎯 **Language-Specific Refactoring Overview**

### **Supported Languages**

- **Python** - Web frameworks, data science, automation
- **TypeScript** - Frontend frameworks, Node.js applications
- **JavaScript** - Browser applications, Node.js services
- **Java** - Enterprise applications, Android development
- **C#** - .NET applications, Unity development

### **Pattern Categories**

1. **Code Smell Detection** - Language-specific anti-patterns
2. **Refactoring Techniques** - Language-appropriate transformations
3. **Testing Approaches** - Framework-specific testing strategies
4. **Documentation Standards** - Language-compliant documentation
5. **Performance Considerations** - Language-specific optimizations

---

## 🐍 **Python Refactoring Patterns**

### **Python Code Smells**

#### **Python: Function-Level Smells**

- **Long Functions** (>20 lines)
- **Complex Functions** (>5 cyclomatic complexity)
- **Mixed Responsibilities** (business logic + I/O + validation)
- **Deep Nesting** (>3 levels)
- **Magic Numbers** (unexplained constants)

#### **Python: Class-Level Smells**

- **Large Classes** (>200 lines)
- **God Classes** (too many responsibilities)
- **Data Classes** (classes that are just data containers)
- **Inheritance Abuse** (deep inheritance hierarchies)
- **Mixed Abstractions** (different levels of abstraction)

#### **Python: Module-Level Smells**

- **Circular Imports** (modules importing each other)
- **Unused Imports** (imported but never used)
- **Mixed Concerns** (different responsibilities in same file)
- **Poor Naming** (unclear variable/function names)

### **Python Refactoring Techniques**

#### **Python: Function Refactoring**

```python
# Before: Long function with mixed responsibilities
def process_user_data(user_data, validate=True, send_email=True):
    # 50+ lines of mixed logic
    if validate:
        # validation logic
        pass
    if send_email:
        # email logic
        pass
    # more mixed logic...

# After: Separated responsibilities
def process_user_data(user_data, validate=True, send_email=True):
    if validate:
        user_data = validate_user_data(user_data)
    
    processed_data = process_validated_data(user_data)
    
    if send_email:
        send_processing_email(processed_data)
    
    return processed_data

def validate_user_data(user_data):
    # Validation logic only
    pass

def process_validated_data(user_data):
    # Processing logic only
    pass

def send_processing_email(processed_data):
    # Email logic only
    pass
```

#### **Python: Class Refactoring**

```python
# Before: Large class with mixed responsibilities
class UserManager:
    def __init__(self):
        self.db = Database()
        self.cache = RedisCache()
        self.email_service = EmailService()
    
    def create_user(self, user_data):
        # User creation logic
        pass
    
    def send_email(self, user_id, template):
        # Email sending logic
        pass
    
    def validate_user_data(self, data):
        # Validation logic
        pass
    
    def cache_user_data(self, user_id, data):
        # Caching logic
        pass

# After: Separated into focused classes
class UserManager:
    def __init__(self, db, cache, email_service):
        self.db = db
        self.cache = cache
        self.email_service = email_service
    
    def create_user(self, user_data):
        validated_data = self.validator.validate(user_data)
        user = self.db.create(validated_data)
        self.cache.set(f"user:{user.id}", user)
        return user

class UserValidator:
    def validate(self, data):
        # Validation logic only
        pass

class UserCache:
    def set(self, key, value):
        # Caching logic only
        pass
```

### **Python Testing Strategies**

#### **Python: pytest Framework**

```python
# test_user_manager.py
import pytest
from unittest.mock import Mock, patch
from user_manager import UserManager

class TestUserManager:
    @pytest.fixture
    def mock_db(self):
        return Mock()
    
    @pytest.fixture
    def mock_cache(self):
        return Mock()
    
    @pytest.fixture
    def user_manager(self, mock_db, mock_cache):
        return UserManager(mock_db, mock_cache, Mock())
    
    def test_create_user_success(self, user_manager, mock_db):
        user_data = {"name": "John", "email": "john@example.com"}
        expected_user = {"id": 1, **user_data}
        mock_db.create.return_value = expected_user
        
        result = user_manager.create_user(user_data)
        
        assert result == expected_user
        mock_db.create.assert_called_once_with(user_data)
    
    def test_create_user_validation_failure(self, user_manager):
        invalid_data = {"name": ""}  # Empty name
        
        with pytest.raises(ValueError, match="Name cannot be empty"):
            user_manager.create_user(invalid_data)
```

#### **Python: Coverage Requirements**

- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: 100%
- **Critical Path Coverage**: 100%

### **Python Documentation Standards**

#### **Python: Docstring Format (PEP 257)**

```python
def create_user(user_data: dict, validate: bool = True) -> dict:
    """Create a new user in the system.
    
    Args:
        user_data: Dictionary containing user information
        validate: Whether to validate user data before creation
        
    Returns:
        Dictionary containing created user with ID
        
    Raises:
        ValueError: If user data is invalid
        DatabaseError: If database operation fails
        
    Example:
        >>> user_data = {"name": "John", "email": "john@example.com"}
        >>> user = create_user(user_data)
        >>> user["id"]
        1
    """
    pass
```

#### **Python: Type Hints (PEP 484)**

```python
from typing import Dict, List, Optional, Union
from dataclasses import dataclass

@dataclass
class UserData:
    name: str
    email: str
    age: Optional[int] = None

def process_users(users: List[UserData]) -> Dict[str, UserData]:
    """Process a list of users and return by email."""
    return {user.email: user for user in users}
```

---

## 🔷 **TypeScript Refactoring Patterns**

### **TypeScript Code Smells**

#### **TypeScript: Component-Level Smells**

- **Large Components** (>200 lines)
- **Mixed Concerns** (UI + business logic + data fetching)
- **Prop Drilling** (passing props through many levels)
- **Any Types** (using `any` instead of proper types)
- **Complex State** (overly complex state management)

#### **TypeScript: Type-Level Smells**

- **Complex Interfaces** (too many properties)
- **Any Types** (loss of type safety)
- **Type Assertions** (unsafe type casting)
- **Generic Abuse** (overly complex generics)
- **Union Type Complexity** (too many union members)

#### **TypeScript: Module-Level Smells**

- **Circular Dependencies** (modules importing each other)
- **Mixed Exports** (different types of exports)
- **Unused Imports** (imported but never used)
- **Poor Module Structure** (unclear module boundaries)

### **TypeScript Refactoring Techniques**

#### **Component Refactoring**

```typescript
// Before: Large component with mixed concerns
class UserDashboard extends React.Component<UserDashboardProps, UserDashboardState> {
    // 200+ lines of mixed UI, business logic, and data fetching
    
    componentDidMount() {
        this.fetchUserData();
        this.fetchUserPreferences();
        this.setupEventListeners();
    }
    
    render() {
        // Complex render method with mixed logic
        return (
            <div>
                {/* 100+ lines of JSX with mixed concerns */}
            </div>
        );
    }
}

// After: Separated into focused components
const UserDashboard: React.FC<UserDashboardProps> = ({ userId }) => {
    const { user, loading, error } = useUserData(userId);
    const { preferences } = useUserPreferences(userId);
    
    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    
    return (
        <div className="user-dashboard">
            <UserProfile user={user} />
            <UserPreferences preferences={preferences} />
            <UserActions userId={userId} />
        </div>
    );
};

const UserProfile: React.FC<{ user: User }> = ({ user }) => (
    <div className="user-profile">
        <Avatar src={user.avatar} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
    </div>
);
```

#### **Type Refactoring**

```typescript
// Before: Complex interface with mixed concerns
interface UserData {
    id: number;
    name: string;
    email: string;
    age: number;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    preferences: {
        theme: string;
        language: string;
        notifications: boolean;
        privacy: {
            profileVisibility: string;
            dataSharing: boolean;
            marketingEmails: boolean;
        };
    };
    // ... more mixed properties
}

// After: Separated into focused interfaces
interface UserBasicInfo {
    id: number;
    name: string;
    email: string;
    age: number;
}

interface Address {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

interface PrivacySettings {
    profileVisibility: ProfileVisibility;
    dataSharing: boolean;
    marketingEmails: boolean;
}

interface UserPreferences {
    theme: Theme;
    language: Language;
    notifications: boolean;
    privacy: PrivacySettings;
}

interface UserData {
    basic: UserBasicInfo;
    address: Address;
    preferences: UserPreferences;
}
```

### **TypeScript Testing Strategies**

#### **TypeScript: Jest + React Testing Library**

```typescript
// UserDashboard.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import UserDashboard from './UserDashboard';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

const renderWithQueryClient = (component: React.ReactElement) => {
    const queryClient = createTestQueryClient();
    return render(
        <QueryClientProvider client={queryClient}>
            {component}
        </QueryClientProvider>
    );
};

describe('UserDashboard', () => {
    it('should display user profile when data loads', async () => {
        renderWithQueryClient(<UserDashboard userId="123" />);
        
        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('john@example.com')).toBeInTheDocument();
        });
    });
    
    it('should show loading state initially', () => {
        renderWithQueryClient(<UserDashboard userId="123" />);
        expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
    
    it('should show error state when data fails to load', async () => {
        renderWithQueryClient(<UserDashboard userId="invalid" />);
        
        await waitFor(() => {
            expect(screen.getByText('Failed to load user data')).toBeInTheDocument();
        });
    });
});
```

#### **TypeScript: Coverage Requirements**

- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: 100%
- **Type Coverage**: 100%

### **TypeScript Documentation Standards**

#### **TypeScript: JSDoc Comments**

```typescript
/**
 * Creates a new user in the system
 * 
 * @param userData - User information for creation
 * @param validate - Whether to validate user data before creation
 * @returns Promise that resolves to the created user
 * @throws {ValidationError} When user data is invalid
 * @throws {DatabaseError} When database operation fails
 * 
 * @example
 * ```typescript
 * const userData = { name: 'John', email: 'john@example.com' };
 * const user = await createUser(userData);
 * console.log(`Created user with ID: ${user.id}`);
 * ```
 */
async function createUser(
    userData: CreateUserData, 
    validate: boolean = true
): Promise<User> {
    // Implementation
}
```

---

## 🔶 **JavaScript Refactoring Patterns**

### **JavaScript Code Smells**

#### **JavaScript: Function-Level Smells**

- **Callback Hell** (deeply nested callbacks)
- **Long Functions** (>20 lines)
- **Mixed Responsibilities** (business logic + I/O + validation)
- **Global Variables** (polluting global scope)
- **Magic Numbers** (unexplained constants)

#### **JavaScript: Module-Level Smells**

- **Mixed Concerns** (different responsibilities in same file)
- **Poor Error Handling** (no error handling or generic catches)
- **Unused Code** (dead code, unused functions)
- **Poor Naming** (unclear variable/function names)
- **No Modularity** (everything in one file)

### **JavaScript Refactoring Techniques**

#### **JavaScript: Async/Await Refactoring**

```javascript
// Before: Callback hell
function processUserData(userId, callback) {
    getUser(userId, function(user) {
        if (user) {
            validateUser(user, function(isValid) {
                if (isValid) {
                    updateUser(user, function(updatedUser) {
                        callback(null, updatedUser);
                    });
                } else {
                    callback('Invalid user');
                }
            });
        } else {
            callback('User not found');
        }
    });
}

// After: Clean async/await with separation of concerns
async function processUserData(userId) {
    try {
        const user = await getUser(userId);
        if (!user) throw new Error('User not found');
        
        const isValid = await validateUser(user);
        if (!isValid) throw new Error('Invalid user');
        
        return await updateUser(user);
    } catch (error) {
        throw new Error(`Failed to process user data: ${error.message}`);
    }
}

async function getUser(userId) {
    // User retrieval logic
}

async function validateUser(user) {
    // Validation logic
}

async function updateUser(user) {
    // Update logic
}
```

#### **JavaScript: Module Refactoring**

```javascript
// Before: Mixed concerns in single file
// userManager.js - 200+ lines
function createUser(userData) {
    // User creation logic
}

function sendEmail(userId, template) {
    // Email logic
}

function validateUserData(data) {
    // Validation logic
}

function processPayment(userId, amount) {
    // Payment logic
}

// After: Separated into focused modules
// userManager.js
import { validateUserData } from './validation.js';
import { sendEmail } from './emailService.js';

export async function createUser(userData) {
    const validatedData = await validateUserData(userData);
    // User creation logic only
}

// validation.js
export async function validateUserData(data) {
    // Validation logic only
}

// emailService.js
export async function sendEmail(userId, template) {
    // Email logic only
}

// paymentService.js
export async function processPayment(userId, amount) {
    // Payment logic only
}
```

### **JavaScript Testing Strategies**

#### **JavaScript: Jest Framework**

```javascript
// userManager.test.js
import { createUser } from './userManager';
import { validateUserData } from './validation';
import { sendEmail } from './emailService';

// Mock dependencies
jest.mock('./validation');
jest.mock('./emailService');

describe('UserManager', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    
    it('should create user successfully', async () => {
        const userData = { name: 'John', email: 'john@example.com' };
        const mockUser = { id: 1, ...userData };
        
        validateUserData.mockResolvedValue(mockUser);
        sendEmail.mockResolvedValue(true);
        
        const result = await createUser(userData);
        
        expect(result).toEqual(mockUser);
        expect(validateUserData).toHaveBeenCalledWith(userData);
        expect(sendEmail).toHaveBeenCalledWith(mockUser.id, 'welcome');
    });
    
    it('should throw error for invalid user data', async () => {
        const invalidData = { name: '', email: 'invalid-email' };
        validateUserData.mockRejectedValue(new Error('Invalid data'));
        
        await expect(createUser(invalidData)).rejects.toThrow('Invalid data');
    });
});
```

#### **JavaScript: Coverage Requirements**

- **Line Coverage**: >90%
- **Branch Coverage**: >85%
- **Function Coverage**: 100%
- **Error Path Coverage**: 100%

---

## ☕ **Java Refactoring Patterns**

### **Java Code Smells**

#### **Java: Class-Level Smells**

- **Large Classes** (>200 lines)
- **God Classes** (too many responsibilities)
- **Data Classes** (classes that are just data containers)
- **Inheritance Abuse** (deep inheritance hierarchies)
- **Mixed Abstractions** (different levels of abstraction)

#### **Java: Method-Level Smells**

- **Long Methods** (>20 lines)
- **Complex Methods** (>5 cyclomatic complexity)
- **Mixed Responsibilities** (business logic + I/O + validation)
- **Deep Nesting** (>3 levels)
- **Magic Numbers** (unexplained constants)

### **Java Refactoring Techniques**

#### **Java: Class Refactoring**

```java
// Before: Large class with mixed responsibilities
public class UserManager {
    private Database database;
    private EmailService emailService;
    private ValidationService validationService;
    
    public User createUser(UserData userData) {
        // 50+ lines of mixed logic
        if (validationService.validate(userData)) {
            // validation logic
        }
        if (emailService.shouldSendWelcomeEmail(userData)) {
            // email logic
        }
        // more mixed logic...
    }
    
    public void sendEmail(String userId, String template) {
        // Email logic
    }
    
    public boolean validateUserData(UserData data) {
        // Validation logic
    }
}

// After: Separated into focused classes
public class UserManager {
    private final UserRepository userRepository;
    private final UserValidator userValidator;
    private final UserEmailService userEmailService;
    
    public User createUser(UserData userData) {
        User validatedUser = userValidator.validate(userData);
        User createdUser = userRepository.save(validatedUser);
        userEmailService.sendWelcomeEmail(createdUser);
        return createdUser;
    }
}

public class UserValidator {
    public User validate(UserData userData) {
        // Validation logic only
    }
}

public class UserEmailService {
    public void sendWelcomeEmail(User user) {
        // Email logic only
    }
}
```

### **Java Testing Strategies**

#### **Java: JUnit 5 + Mockito**

```java
// UserManagerTest.java
@ExtendWith(MockitoExtension.class)
class UserManagerTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private UserValidator userValidator;
    
    @Mock
    private UserEmailService userEmailService;
    
    @InjectMocks
    private UserManager userManager;
    
    @Test
    void shouldCreateUserSuccessfully() {
        // Given
        UserData userData = new UserData("John", "john@example.com");
        User validatedUser = new User(1L, "John", "john@example.com");
        User savedUser = new User(1L, "John", "john@example.com");
        
        when(userValidator.validate(userData)).thenReturn(validatedUser);
        when(userRepository.save(validatedUser)).thenReturn(savedUser);
        
        // When
        User result = userManager.createUser(userData);
        
        // Then
        assertThat(result).isEqualTo(savedUser);
        verify(userValidator).validate(userData);
        verify(userRepository).save(validatedUser);
        verify(userEmailService).sendWelcomeEmail(savedUser);
    }
    
    @Test
    void shouldThrowExceptionForInvalidUserData() {
        // Given
        UserData invalidData = new UserData("", "invalid-email");
        when(userValidator.validate(invalidData))
            .thenThrow(new ValidationException("Invalid data"));
        
        // When & Then
        assertThatThrownBy(() -> userManager.createUser(invalidData))
            .isInstanceOf(ValidationException.class)
            .hasMessage("Invalid data");
    }
}
```

---

## 🔗 **Related Documentation**

- **[Main Protocol](mdc:prompts/code/self_executing_refactor_protocol.md)** - Core execution engine and templates
- **[Examples & Workflows](mdc:prompts/code/refactor_protocol_examples.md)** - Workflow examples and troubleshooting
- **[Template Reference](mdc:prompts/code/refactor_protocol_templates.md)** - Extended template variations
- **[Testing Guide](mdc:prompts/code/refactor_protocol_testing.md)** - Testing procedures and validation

---

**Remember**: Language-specific patterns ensure refactoring follows best practices for each technology. Use these patterns to guide your refactoring decisions and maintain code quality.
