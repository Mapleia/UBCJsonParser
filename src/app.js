//const mkdirp = require('mkdirp');
const jsonfile = require('jsonfile');
const fs = require('fs');
const _progress = require('cli-progress');

const bar1 = new _progress.Bar({
    // green bar, reset styles after bar element
    format: ' >> [\u001b[32m{bar}\u001b[0m] {percentage}% | {value}/{total}',

    // same chars for bar elements, just separated by colors
    barCompleteChar: '#',
    barIncompleteChar: '#',

    // change color to yellow between bar complete/incomplete -> incomplete becomes yellow
    barGlue: '\u001b[33m'
});

const bar2 = new _progress.Bar({
    // green bar, reset styles after bar element
    format: ' >> [\u001b[32m{bar}\u001b[0m] {percentage}% | {value}/{total}',

    // same chars for bar elements, just separated by colors
    barCompleteChar: '#',
    barIncompleteChar: '#',

    // change color to yellow between bar complete/incomplete -> incomplete becomes yellow
    barGlue: '\u001b[33m'
});

function rewriteMasterFile(folder, year, jsonfilename, parsedJSON) {
    parsedJSON.forEach(dept => {
        dept.courses = Object.values(dept.courses[0]);
        dept.courses.forEach(course => {
            course.sections = Object.values(course.sections);
        })
    });
    let file = `${folder}${year}/${jsonfilename}.json`;
    jsonfile.writeFileSync(file, parsedJSON);
} 


function filterDeptForUndergrad(parsedJSON) {
    let deptArr = [];

    parsedJSON.forEach(dept => {
        if (!deptArr.includes(dept.code)) {
            if (!(dept.courses.length == 0)) {
                if (typeof(dept.courses[0]["course_number"]) == "string") {
                    if (parseInt(dept.courses[0].course_number) <= 499) {
                        deptArr.push(dept.code);
                    }
                } else if (dept.courses[0].course_number <= 499) {
                        deptArr.push(dept.code);
                    }
                }
            }
    });
    return deptArr;
}

// REQUIRES: - Parsed JSON with an array of deparments and their offerings
//           - Each department having an key ("courses").
//           - "courses" value must be an ascending array of course codes.
//           - All undergrad course #s must be < 500.
// EFFECT: Filters the parsedJSON for departments that offers courses for undergrads (based on course #). 
//          Reformat object.
function filterAndFormatJSON(parsedJSON, deptArr) {
    let coursesArr = [];
    console.log(deptArr.length);
    bar1.start(deptArr.length, 0);

    let value = 0;
    parsedJSON.forEach(dept => {
        value ++;
        if (deptArr.includes(dept.code)) {
            dept.courses.forEach(course => {
                    FormatCourse(course);
            });
            coursesArr.push(dept);
        }
        bar1.update(value, {
            percentage: (value/deptArr.length)*100
        });

        if (value == deptArr.length) {
            bar1.stop();
        }
    });

    return coursesArr;
}

function FormatCourse(course) {
    hasTerm1 = false;
    hasTerm2 = false;
    hasTerm12 = false;
    
    let availableActivity = [];

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

        section.days = section.days.trim().toUpperCase().split(" ");
        if (section.start.length === 4) {
            section.start = "0" + section.start;
        }
        if (section.end.length === 4) {
            section.end = "0" + section.end;
        }

        if (!availableActivity.includes(section.activity)) {
            availableActivity.push(section.activity);
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

    course["terms"] = termArr;
    course["activities"] = availableActivity; 
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
/* function create_MASTERFILE(folder, year, parsedJSON) {
    parsedJSON.forEach(element => {
        let file = `${folder}${year}/${element.code}/MASTER.json`;

        jsonfile.writeFileSync(file, element);
    })
} */

// REQUIRES: - A formatted string of the folder location (./FOLDERNAME/)
//           - String of the academic year
//           - A string of a JSON file name with ALL of the courses (Do not put file ext (.json)!!)
//           - Department folders previously setup. (With the DEPARTMENT CODES)
// EFFECT: Creates all the JSON classes files located in the ./data/YEAR/DEPARTMENT_CODE folder.
function create_COURSE_SECTION_FILE(folder, year, parsedJSON, deptAmount) {
    bar2.start(deptAmount, 0);

    let value = 0;
    parsedJSON.forEach(DEPT => {
        value++;
        DEPT.courses.forEach(c => {
            let file = `${folder}${year}/${c.subject_code}/${c.course_name}.json`;;
            jsonfile.writeFileSync(file, c, { spaces: 2 });
        });
        bar2.update(value, {
            percentage: (value/deptAmount)*100
        });
        if (value == deptAmount) {
            bar2.stop();
        }
    });

    console.log("\nCreated all section files!");
}

// REQUIRES: - String of folder directory, suggested is /.data/
//           - String of academic school year, suggested: YEAR+W (winter) OR YEAR+S (summer)
//           - String of the JSON file name (no .json!!) with all of the courses
// EFFECT: Creates individual files about the courses in department divided 
//         folders in the given directory.
function main(folder, year, jsonfilename) {
    //const PARSED_JSON_OG = jsonfile.readFileSync(`${folder}${year}/${jsonfilename}.json`); // {}
    //rewriteMasterFile(folder, year, jsonfilename, PARSED_JSON_OG);

    const PARSED_JSON = jsonfile.readFileSync(`${folder}${year}/${jsonfilename}.json`);
    const DEPT_CODES = filterDeptForUndergrad(PARSED_JSON);                             // []
    const UNDERGRAD_ARR = filterAndFormatJSON(PARSED_JSON, DEPT_CODES);                 // {}
    create_FOLDERS_from_arr(folder, year, DEPT_CODES);
    create_COURSE_SECTION_FILE(folder, year, UNDERGRAD_ARR, DEPT_CODES.length);
}

main('../data/', "2020W", "2020W-ALL");

