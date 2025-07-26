#include <iostream>
#include <string>
#include <fstream>
#include <vector>
#include <algorithm>
#include <limits>

using namespace std;

class Student {
public:
    string name;
    int rollno;
    float marks[5];
    string grade;
    float total;
    float percentage;

    Student() : total(0.0), percentage(0.0), rollno(0) {
        for (int i = 0; i < 5; i++) {
            marks[i] = 0.0;
        }
    }

    void getdata() {
        cout << "Enter student's name: ";
        cin.ignore(numeric_limits<streamsize>::max(), '\n'); // Clear input buffer
        getline(cin, name);
        
        cout << "Enter student's roll number: ";
        cin >> rollno;
        
        cout << "Enter marks in the format (sic oopc cst ese cgd): ";
        for (int i = 0; i < 5; i++) {
            cin >> marks[i];
            // Input validation
            while (marks[i] < 0 || marks[i] > 100) {
                cout << "Invalid marks! Please enter a value between 0 and 100: ";
                cin >> marks[i];
            }
        }
    }

    void setdata() {
        total = 0.0; // Reset total before calculation
        for (int i = 0; i < 5; i++) {
            total += marks[i];
        }
        percentage = (total / 500) * 100;
        
        // Assign grade based on percentage
        if (percentage >= 90) grade = "A1";
        else if (percentage >= 80) grade = "A2";
        else if (percentage >= 70) grade = "B1";
        else if (percentage >= 60) grade = "B2";
        else if (percentage >= 50) grade = "C";
        else if (percentage >= 40) grade = "D";
        else if (percentage >= 35) grade = "E";
        else grade = "FAIL";
    }
    
    void display() {
        cout << "\n========== STUDENT REPORT ==========\n";
        cout << "Name: " << name << endl;
        cout << "Roll No.: " << rollno << endl;
        cout << "\nMarks:\n";
        cout << "1. SIC: " << marks[0] << endl;
        cout << "2. OOPC: " << marks[1] << endl;
        cout << "3. CST: " << marks[2] << endl;
        cout << "4. ESE: " << marks[3] << endl;
        cout << "5. CGD: " << marks[4] << endl;
        cout << "\nTotal Marks: " << total << "/500" << endl;
        cout << "Percentage: " << percentage << "%" << endl;
        cout << "Grade: " << grade << endl;
        cout << "===================================\n";
    }
};

// Function to save reports to a file
void saveReportsToFile(const vector<Student>& students) {
    if (students.empty()) {
        cout << "No student data to save!" << endl;
        return;
    }
    
    ofstream outFile("student_reports.txt");
    if (!outFile) {
        cout << "Error: Unable to open file for writing!" << endl;
        return;
    }
    
    outFile << "======== STUDENT PROGRESS REPORT ========\n\n";
    for (const auto& student : students) {
        outFile << "Name: " << student.name << endl;
        outFile << "Roll No.: " << student.rollno << endl;
        outFile << "Marks:\n";
        outFile << "  SIC: " << student.marks[0] << endl;
        outFile << "  OOPC: " << student.marks[1] << endl;
        outFile << "  CST: " << student.marks[2] << endl;
        outFile << "  ESE: " << student.marks[3] << endl;
        outFile << "  CGD: " << student.marks[4] << endl;
        outFile << "Total Marks: " << student.total << "/500" << endl;
        outFile << "Percentage: " << student.percentage << "%" << endl;
        outFile << "Grade: " << student.grade << endl;
        outFile << "-----------------------------------\n\n";
    }
    
    outFile.close();
    cout << "The information has been successfully stored in 'student_reports.txt'!" << endl;
}

// Function to find student by roll number
Student* findStudentByRoll(vector<Student>& students, int rollno) {
    for (auto& student : students) {
        if (student.rollno == rollno) {
            return &student;
        }
    }
    return nullptr;
}

// Function to compare students and find highest percentage
void compareStudents(const vector<Student>& students) {
    if (students.empty()) {
        cout << "No students to compare!" << endl;
        return;
    }
    
    float maxPercentage = students[0].percentage;
    int topStudentIndex = 0;
    
    for (size_t i = 1; i < students.size(); i++) {
        if (students[i].percentage > maxPercentage) {
            maxPercentage = students[i].percentage;
            topStudentIndex = i;
        }
    }
    
    cout << "\n========== COMPARISON RESULTS ==========\n";
    cout << "Highest scoring student: " << students[topStudentIndex].name << endl;
    cout << "Roll No.: " << students[topStudentIndex].rollno << endl;
    cout << "Percentage: " << maxPercentage << "%" << endl;
    cout << "Grade: " << students[topStudentIndex].grade << endl;
    
    cout << "\nAll students sorted by percentage (highest to lowest):\n";
    
    // Make a copy to sort
    vector<Student> sortedStudents = students;
    sort(sortedStudents.begin(), sortedStudents.end(), 
         [](const Student& a, const Student& b) {
             return a.percentage > b.percentage;
         });
    
    for (const auto& student : sortedStudents) {
        cout << student.name << " (Roll No. " << student.rollno << "): " 
             << student.percentage << "% - Grade: " << student.grade << endl;
    }
    cout << "======================================\n";
}

int main() {
    vector<Student> students;
    int choice;
    bool running = true;
    
    cout << "Welcome to Student Progress Tracker\n";
    
    while (running) {
        cout << "\n========== MAIN MENU ==========\n";
        cout << "1. Add new Student\n";
        cout << "2. View student report\n";
        cout << "3. Compare students by percentage\n";
        cout << "4. Save reports to file\n";
        cout << "5. Exit\n";
        cout << "Enter your choice: ";
        
        // Input validation for menu choice
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid input! Please enter a number.\n";
            continue;
        }
        
        switch (choice) {
            case 1: {
                int numStudents;
                cout << "How many students do you want to add? ";
                cin >> numStudents;
                
                // Input validation
                while (numStudents <= 0) {
                    cout << "Please enter a positive number: ";
                    cin >> numStudents;
                }
                
                for (int i = 0; i < numStudents; i++) {
                    cout << "\nEntering data for Student " << (i+1) << ":\n";
                    Student newStudent;
                    newStudent.getdata();
                    newStudent.setdata();
                    students.push_back(newStudent);
                    cout << "Student data added successfully!\n";
                }
                break;
            }
            case 2: {
                if (students.empty()) {
                    cout << "No students added yet!\n";
                    break;
                }
                
                int rollno;
                cout << "Enter student roll number: ";
                cin >> rollno;
                
                Student* found = findStudentByRoll(students, rollno);
                if (found) {
                    found->display();
                } else {
                    cout << "Student with roll number " << rollno << " not found!\n";
                }
                break;
            }
            case 3: {
                compareStudents(students);
                break;
            }
            case 4: {
                saveReportsToFile(students);
                break;
            }
            case 5: {
                cout << "Thank you for using Student Progress Tracker!\n";
                running = false;
                break;
            }
            default: {
                cout << "Invalid choice! Please enter a number between 1 and 5.\n";
                break;
            }
        }
    }
    
    return 0;
}