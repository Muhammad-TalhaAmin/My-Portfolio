# CString - Custom String Class Implementation

A comprehensive C++ implementation of a custom string class that demonstrates object-oriented programming principles, memory management, and string manipulation techniques. This project serves as both an educational resource and a functional string utility class.

## Overview

CString is a complete custom string implementation that provides a wide range of string manipulation operations, rivaling many of the features found in the standard C++ `std::string` class. The implementation emphasizes deep understanding of memory management, pointer operations, and classical C++ programming concepts.

## Key Features

### Core String Operations
- **Constructor Overloading**: Multiple constructors for different initialization patterns
- **Length Management**: Dynamic string length calculation and resizing
- **Character Access**: Direct element access and modification via `at()` operator
- **Equality Comparison**: String comparison with both CString and C-style string support

### String Manipulation
- **Find Operations**: Locate substrings and individual characters
- **Insert/Delete**: Insert characters/substrings at positions, remove segments or characters
- **Substring Extraction**: Get left and right segments of strings
- **Replace Operations**: Replace single characters, multiple characters, or entire substrings
- **Trim Operations**: Remove whitespace from left, right, or both sides
- **Case Conversion**: Convert between uppercase and lowercase
- **Reversal**: Reverse string order

### Advanced Operations
- **Concatenation**: Combine strings with `+` operator and `+=` assignment operator
- **Resizing**: Dynamically resize strings
- **Input/Output**: Read strings from console with built-in input handling
- **Empty Check**: Determine if string contains only whitespace

## API Reference

### Public Methods

#### Constructor/Destructor
- `CString()`: Default constructor (creates empty string)
- `CString(char c)`: Single character constructor
- `CString(char* c)`: C-style string constructor
- `CString(const CString& c)`: Copy constructor
- `~CString()`: Destructor (handles memory cleanup)

#### Core Properties
- `getLength()`: Returns current string length
- `isEmpty()`: Checks if string contains only whitespace

#### Element Access
- `at(int index)`: Returns reference to character at position (with bounds checking)

#### String Operations
- `display() const`: Outputs string to console
- `find(char* substr, int start=0) const`: Locates substring
- `find(char ch, int start=0) const`: Locates character

#### Modification Operations
- `input()`: Reads string from standard input
- `insert(int index, char* substr)`: Inserts substring
- `insert(int index, char ch)`: Inserts character
- `remove(int index, int count=1)`: Removes segment
- `remove(char ch)`: Removes all occurrences of character
- `replace(char New)`: Replaces all characters
- `replace(char old, char New)`: Replaces all occurrences of old char
- `replace(char* old, char* New)`: Replaces all occurrences of substring

#### String Transformations
- `trim()`: Removes leading and trailing whitespace
- `trimLeft()`: Removes leading whitespace
- `trimRight()`: Removes trailing whitespace
- `makeUpper()`: Converts to uppercase
- `makeLower()`: Converts to lowercase
- `reverse()`: Reverses string order

#### String Combination
- `concat(const CString& s2) const`: Returns new concatenated string
- `concatEqual(const CString& s2)`: Appends CString
- `concatEqual(char* s2)`: Appends C-string

#### Substring Operations
- `left(int count) const`: Returns left segment
- `right(int count) const`: Returns right segment

#### String Management
- `Resize(int add)`: Changes string length

## Usage Example

```cpp
#include <iostream>
#include "CString.cpp"

int main() {
    // Basic construction
    CString s1;                    // Empty string
    CString s2('A');               // Single character
    char hello[] = "Hello";
    CString s3(hello);            // From C-string
    
    // String manipulation
    s3.insert(5, " World");       // Insert " World"
    s3.makeUpper();               // Convert to uppercase
    s3.reverse();                 // Reverse string
    
    // Concatenation
    CString greeting = s3.concat("!");
    
    // Comparison
    if (s1.isEqual(s3)) {
        std::cout << "Strings are equal!\n";
    }
    
    // Display results
    s3.display();                 // Outputs: "DLROW WORLD"
    
    return 0;
}
```

## Implementation Details

### Memory Management
- Uses dynamic memory allocation with `new char[]` for string storage
- Manual memory deallocation in destructor with `delete[]`
- Proper handling of null terminators (`\0`)
- Copy constructor ensures deep copying

### String Length Calculation
- Uses helper function `length(char* c)` for C-string length calculation
- Length calculated as number of characters excluding null terminator
- Size tracking maintained for all operations

### Operations Design
- All operations modify the string object directly (except `concat()` which returns new object)
- Functions handle edge cases (empty strings, bounds checking)
- Memory is properly deallocated and reallocated during modifications

## Comparison with `std::string`

| Feature | CString | `std::string` |
|---------|---------|---------------|
| Type | Custom class | Standard library |
| Memory Management | Manual (educational) | Automatic |
| Performance | Slower (checks) | Optimized |
| Features | Comprehensive | Full-featured |
| Learning Value | High (conceptual) | Low |

## Testing and Demonstration

The implementation includes a comprehensive test suite in `main()` demonstrating:

- Constructor tests
- Length calculation
- Find operations
- Insert and remove operations
- Left and right extraction
- Replace operations (various types)
- Trim operations
- Case conversion
- String reversal
- Resize operations
- Concatenation
- Equality comparisons
- Element access via `at()`

## Project Structure

- `CString.cpp`: Main implementation file containing the entire class with member functions
- `README.md`: This documentation file

## Building and Running

This is a single-file implementation:

### Linux/macOS
```bash
g++ -std=c++11 -o CString CString.cpp
./CString
```

### Windows (Visual Studio)
1. Create new empty project
2. Add `CString.cpp` as source file
3. Set C++ standard to C++11 or later
4. Run program

### Windows (Command Line)
```cmd
g++ -std=c++11 -o CString.exe CString.cpp
CString.exe
```

## Performance Considerations

### Strengths
- Educational value for understanding string implementation
- Complete control over memory operations
- Demonstrates OOP concepts
- No external dependencies

### Limitations
- Slower than `std::string` due to manual management
- No exception safety guarantees
- Limited string view operations
- Higher risk of memory errors without care

## Use Cases

### Educational
- Learning C++ memory management
- Understanding string implementation internals
- Practicing OOP principles
- Studying algorithms for string manipulation

### Practical (with caution)
- Simple string processing in educational contexts
- Environments with strict C++98/C++03 requirements
- Demonstrating custom implementations

## Best Practices

1. **Memory Safety**: Always handle exceptions properly in production code
2. **Resource Management**: Consider using RAII wrappers around CString
3. **Performance**: For production, prefer `std::string` over CString
4. **Testing**: Extend the existing test suite with edge cases
5. **Security**: Be cautious with buffer operations and bounds checking

## Extensions (Future Work)

1. **Template Support**: Make CString template for different character types
2. **Iterator Support**: Add begin/end iterators for range-based operations
3. **String Views**: Implement non-owning string references
4. **Interoperability**: Add conversion operators to/from std::string
5. **Modern C++**: Incorporate move semantics, emplace, etc.

## License

This implementation is provided for educational purposes with a focus on demonstrating C++ string manipulation concepts and memory management techniques.

## Credits

Created for educational demonstration of:
- Object-Oriented Programming
- Dynamic memory management
- String manipulation algorithms
- C++ class design patterns
