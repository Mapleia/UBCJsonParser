//const mkdirp = require('mkdirp');
const jsonfile = require('jsonfile');
const fs = require('fs');

// REQUIRES: - Parsed JSON with an array of deparments and their offerings
//           - Each department having an key ("courses").
//           - "courses" value must be an ascending array of course codes.
//           - All undergrad course #s must be < 500.
// EFFECT: Filters the parsedJSON for departments that offers courses for undergrads (based on course #).
function filter_for_Undergrad(parsedJSON) {
    let courseArr = [];

    parsedJSON.forEach(element => {
        let key = Object.keys(element.courses[0])[0];
        let type = typeof(key);
        if (type == "string") {
            if (parseInt(key) < 500) {
                element.courses.forEach(course => {
                    addTermsForCourse(course);
                });
                courseArr.push(element);
            }
        } else {
            if (key < 499) {
                courseArr.push(element);
            }
        }
    });

    return courseArr;
}

function addTermsForCourse(course) {
    hasTerm1 = false;
    hasTerm2 = false;
    hasTerm12 = false;
    course.sections.forEach(section => {
    
        if (section.term == "1") {
            hasTerm1 = true;
        }
        if (section.term == "2") {
            hasTerm2 = true;
        }
        if (section.term == "1-2") {
            hasTerm12 = true;
        }
    });
    let termArr = [];
    if (hasTerm1) {
        termArr.push("1");
    }
    if (hasTerm2) {
        termArr.push("2");
    }
    if (hasTerm12) {
        termArr.push("1-2");
    }
    course.term = termArr;
}

// REQUIRES: Parsed JSON file (parsedJSON)
// EFFECT: Grabs all of the departments code, returns array.
function allDepartmentCodes(parsedJSON) {
    let departmentArr = [];

    parsedJSON.forEach(dep => {
        if (!departmentArr.includes(dep.code)) {
            departmentArr.push(dep.code);
        }
    });

    return departmentArr;
}

// REQUIRES: - A formatted string of the folder location (./FOLDERNAME/)
//           - String of the academic year
//           - Array of strings (array)
// EFFECT: Creates folders in (folder) with the element as the name.
function create_FOLDERS_from_arr(folder, year, array) {
    array.forEach(element => {
        let path =`${folder}${year}/${element}`;
        fs.mkdirSync(path, { recursive: true });
    })
}

// REQUIRES: - A formatted string of the folder location (./FOLDERNAME/)
//           - String of the academic year
//           - a parsedJSON with array of the course offerings
//           - Each element having a department code object key ("code").
//           - Department folders previously setup. (With the DEPARTMENT CODES)
// EFFECT: Creates the MASTER file which contains the overview of the department and their offerings.
function create_MASTERFILE(folder, year, parsedJSON) {
    parsedJSON.forEach(element => {
        let file = `${folder}${year}/${element.code}/MASTER.json`;

        jsonfile.writeFileSync(file, element);
    })
}

// REQUIRES: - A formatted string of the folder location (./FOLDERNAME/)
//           - String of the academic year
//           - A string of a JSON file name with ALL of the courses (Do not put file ext (.json)!!)
//           - Department folders previously setup. (With the DEPARTMENT CODES)
// EFFECT: Creates all the JSON classes files located in the ./data/YEAR/DEPARTMENT_CODE folder.
function create_COURSE_SECTION_FILE(folder, year, parsedJSON) {
    parsedJSON.forEach(DEPT => {
        let DeptCourses = DEPT.courses[0];

        Object.keys(DeptCourses).forEach(c => {
            let file = `${folder}${year}/${DeptCourses[c].subject_code}/${DeptCourses[c].course_name}.json`;

            jsonfile.writeFileSync(file, DeptCourses[c]);
        });

        console.log(`Created all section files for ${DEPT.title}`)
    });

     console.log("Created all section files!");
    
}

// REQUIRES: - String of folder directory, suggested is /.data/
//           - String of academic school year, suggested: YEAR+W (winter) OR YEAR+S (summer)
//           - String of the JSON file name (no .json!!) with all of the courses
// EFFECT: Creates individual files about the courses in department divided 
//         folders in the given directory.
function main(folder, year, jsonfilename) {
    const PARSED_JSON = jsonfile.readFileSync(`${folder}${year}/${jsonfilename}.json`);
    //const PARSED_JSON = JSON.parse(RAW_DATA);
    const UNDERGRAD_ARR = filter_for_Undergrad(PARSED_JSON);

    const DEPT_CODES = allDepartmentCodes(UNDERGRAD_ARR);

    create_FOLDERS_from_arr(folder, year, DEPT_CODES);
    create_MASTERFILE(folder, year, UNDERGRAD_ARR);
    create_COURSE_SECTION_FILE(folder, year, UNDERGRAD_ARR)
}

main('./data/test/', "2020W", "2020W-ALL");
