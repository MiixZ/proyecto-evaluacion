# Batería de Ejercicios de Prueba

Esta documentación contiene 5 ejercicios de ejemplo que utilizan la nueva estructura `runner_code` para envolver el código del estudiante.

## Estructura del runner_code

El `runner_code` es el código completo que se ejecutará. Debe incluir el marcador `{{STUDENT_CODE}}` donde se insertará el código del estudiante.

---

## Ejercicio 1: Suma de Dos Números (Python)

**Título:** Suma de Dos Números  
**Dificultad:** beginner  
**Lenguaje:** python  
**Puntos:** 10

### Template Code (lo que ve el estudiante)

```python
def suma(a, b):
    # Implementa esta función que devuelve la suma de a y b
    pass
```

### Solución

```python
def suma(a, b):
    return a + b
```

### Test Cases

#### Test Case 1

**Input:** (vacío)  
**Expected Output:** `5`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(suma(2, 3))
```

#### Test Case 2

**Input:** (vacío)  
**Expected Output:** `0`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(suma(-5, 5))
```

#### Test Case 3

**Input:** (vacío)  
**Expected Output:** `100`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(suma(99, 1))
```

---

## Ejercicio 2: Factorial (Python)

**Título:** Cálculo de Factorial  
**Dificultad:** intermediate  
**Lenguaje:** python  
**Puntos:** 15

### Template Code

```python
def factorial(n):
    # Devuelve el factorial de n (n!)
    # factorial(0) = 1, factorial(5) = 120
    pass
```

### Solución

```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)
```

### Test Cases

#### Test Case 1

**Input:** (vacío)  
**Expected Output:** `1`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(factorial(0))
```

#### Test Case 2

**Input:** (vacío)  
**Expected Output:** `120`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(factorial(5))
```

#### Test Case 3

**Input:** (vacío)  
**Expected Output:** `3628800`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(factorial(10))
```

---

## Ejercicio 3: Verificar Palíndromo (JavaScript)

**Título:** ¿Es Palíndromo?  
**Dificultad:** beginner  
**Lenguaje:** javascript  
**Puntos:** 10

### Template Code

```javascript
function esPalindromo(str) {
  // Devuelve true si str es un palíndromo, false en caso contrario
  // Ignora mayúsculas/minúsculas y espacios
}
```

### Solución

```javascript
function esPalindromo(str) {
  const clean = str.toLowerCase().replace(/\s/g, "");
  return clean === clean.split("").reverse().join("");
}
```

### Test Cases

#### Test Case 1

**Input:** (vacío)  
**Expected Output:** `true`  
**Runner Code:**

```javascript
{
  {
    STUDENT_CODE;
  }
}

console.log(esPalindromo("ana"));
```

#### Test Case 2

**Input:** (vacío)  
**Expected Output:** `true`  
**Runner Code:**

```javascript
{
  {
    STUDENT_CODE;
  }
}

console.log(esPalindromo("A man a plan a canal Panama"));
```

#### Test Case 3

**Input:** (vacío)  
**Expected Output:** `false`  
**Runner Code:**

```javascript
{
  {
    STUDENT_CODE;
  }
}

console.log(esPalindromo("hola"));
```

---

## Ejercicio 4: Fibonacci (Java)

**Título:** Número de Fibonacci  
**Dificultad:** intermediate  
**Lenguaje:** java  
**Puntos:** 20

### Template Code

```java
public class Solution {
    public static int fibonacci(int n) {
        // Devuelve el n-ésimo número de Fibonacci
        // fib(0)=0, fib(1)=1, fib(2)=1, fib(10)=55
        return 0;
    }
}
```

### Solución

```java
public class Solution {
    public static int fibonacci(int n) {
        if (n <= 0) return 0;
        if (n == 1) return 1;
        int a = 0, b = 1;
        for (int i = 2; i <= n; i++) {
            int temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
}
```

### Test Cases

#### Test Case 1

**Input:** (vacío)  
**Expected Output:** `0`  
**Runner Code:**

```java
{{STUDENT_CODE}}

class Main {
    public static void main(String[] args) {
        System.out.println(Solution.fibonacci(0));
    }
}
```

#### Test Case 2

**Input:** (vacío)  
**Expected Output:** `55`  
**Runner Code:**

```java
{{STUDENT_CODE}}

class Main {
    public static void main(String[] args) {
        System.out.println(Solution.fibonacci(10));
    }
}
```

#### Test Case 3

**Input:** (vacío)  
**Expected Output:** `6765`  
**Runner Code:**

```java
{{STUDENT_CODE}}

class Main {
    public static void main(String[] args) {
        System.out.println(Solution.fibonacci(20));
    }
}
```

---

## Ejercicio 5: Ordenar Lista (Python)

**Título:** Ordenar Lista de Números  
**Dificultad:** advanced  
**Lenguaje:** python  
**Puntos:** 25

### Template Code

```python
def ordenar(lista):
    # Implementa un algoritmo de ordenamiento
    # No uses sort() ni sorted()
    # Devuelve la lista ordenada de menor a mayor
    pass
```

### Solución

```python
def ordenar(lista):
    # Implementación de bubble sort
    n = len(lista)
    for i in range(n):
        for j in range(0, n-i-1):
            if lista[j] > lista[j+1]:
                lista[j], lista[j+1] = lista[j+1], lista[j]
    return lista
```

### Test Cases

#### Test Case 1

**Input:** (vacío)  
**Expected Output:** `[1, 2, 3, 4, 5]`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(ordenar([5, 3, 1, 4, 2]))
```

#### Test Case 2

**Input:** (vacío)  
**Expected Output:** `[-5, -2, 0, 3, 7]`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(ordenar([3, -2, 7, 0, -5]))
```

#### Test Case 3

**Input:** (vacío)  
**Expected Output:** `[1, 1, 2, 3, 3]`  
**Runner Code:**

```python
{{STUDENT_CODE}}

print(ordenar([3, 1, 3, 2, 1]))
```

---

## Nota sobre uso con ejercicios existentes (stdin/stdout)

Para ejercicios que siguen usando el modelo tradicional de stdin/stdout, simplemente deja el campo `runner_code` vacío o nulo. El sistema usará el comportamiento original:

- **Input:** se pasa como stdin al programa
- **Expected Output:** se compara con stdout del programa
- **runner_code:** (vacío/nulo)

---

## Ejercicio 6: Invertir Árbol Binario (C++)

**Título:** Invertir Árbol Binario  
**Dificultad:** intermediate  
**Lenguaje:** cpp  
**Puntos:** 20

### Template Code (lo que ve el estudiante)

```cpp
/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        // Tu código aquí
        return nullptr;
    }
};
```

### Solución

```cpp
class Solution {
public:
    TreeNode* invertTree(TreeNode* root) {
        if (!root) return nullptr;
        TreeNode* temp = root->left;
        root->left = invertTree(root->right);
        root->right = invertTree(temp);
        return root;
    }
};
```

### Test Cases

**Runner Code (Común para todos los casos):**
(Este código incluye helpers para parsear el input estilo `[4,2,7,1,3]`)

```cpp
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <queue>
#include <algorithm>

using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

// --- Código del estudiante ---
{{STUDENT_CODE}}
// ---------------------------

// Helper para construir árbol desde string "[1,2,3,null,5]"
TreeNode* stringToTreeNode(string input) {
    if (input.length() < 2) return nullptr;
    string content = input.substr(1, input.length() - 2);
    if (content.empty()) return nullptr;

    stringstream ss(content);
    string item;
    vector<string> parts;
    while (getline(ss, item, ',')) {
        parts.push_back(item);
    }

    if (parts.empty()) return nullptr;

    TreeNode* root = new TreeNode(stoi(parts[0]));
    queue<TreeNode*> q;
    q.push(root);

    int index = 1;
    while (!q.empty() && index < parts.size()) {
        TreeNode* node = q.front();
        q.pop();

        if (index < parts.size()) {
            string val = parts[index];
            // Eliminar espacios
            val.erase(remove(val.begin(), val.end(), ' '), val.end());
            if (val != "null") {
                node->left = new TreeNode(stoi(val));
                q.push(node->left);
            }
            index++;
        }

        if (index < parts.size()) {
            string val = parts[index];
            val.erase(remove(val.begin(), val.end(), ' '), val.end());
            if (val != "null") {
                node->right = new TreeNode(stoi(val));
                q.push(node->right);
            }
            index++;
        }
    }
    return root;
}

// Helper para imprimir árbol a string "[...]"
string treeNodeToString(TreeNode* root) {
    if (!root) return "[]";

    string output = "";
    queue<TreeNode*> q;
    q.push(root);

    vector<string> values;

    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();

        if (node) {
            values.push_back(to_string(node->val));
            q.push(node->left);
            q.push(node->right);
        } else {
            values.push_back("null");
        }
    }

    // Trim trailing nulls
    while (!values.empty() && values.back() == "null") {
        values.pop_back();
    }

    output += "[";
    for(int i=0; i<values.size(); i++) {
        output += values[i];
        if(i < values.size() - 1) output += ",";
    }
    output += "]";
    return output;
}

int main() {
    string line;
    getline(cin, line);

    TreeNode* root = stringToTreeNode(line);

    Solution solution;
    TreeNode* result = solution.invertTree(root);

    cout << treeNodeToString(result) << endl;

    return 0;
}
```

#### Test Case 1

**Input:** `[4,2,7,1,3,6,9]`  
**Expected Output:** `[4,7,2,9,6,3,1]`

#### Test Case 2

**Input:** `[2,1,3]`  
**Expected Output:** `[2,3,1]`

#### Test Case 3

**Input:** `[]`  
**Expected Output:** `[]`
