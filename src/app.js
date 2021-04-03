const jsonfile = require('jsonfile');
const fs = require('fs');
const _progress = require('cli-progress');
const { exception } = require('console');

class App {
    // Constructs the app.
    //          STRING, STRING, STRING,     BOOLEAN
    constructor(folder, year, allFileName, requiresReWrite) {
        this.folder = folder;           //EX: ../data
        this.year = year;               //EX: 2020W
        this.allFileName = allFileName; //EX: 2020W-ALL
        this.requiresReWrite = requiresReWrite;

        if (this.requiresReWrite) {
                this.parsedJSONOG = jsonfile.readFileSync(`${folder}${year}/${this.allFileName}.json`); // {}
                this.rewriteMasterFile(this.parsedJSONOG);
        }

        this.bar1 = new _progress.Bar({
            // green bar, reset styles after bar element
            format: ' >> [\u001b[32m{bar}\u001b[0m] {percentage}% | {value}/{total}',
        
            // same chars for bar elements, just separated by colors
            barCompleteChar: '#',
            barIncompleteChar: '#',
        
            // change color to yellow between bar complete/incomplete -> incomplete becomes yellow
            barGlue: '\u001b[33m'
        });
    }

    // PRIVATE
    // Used in: constructor
    // EFFECT: Runs when master file is freshly pulled from scrapper.
    rewriteMasterFile(parsedJSON) {
        parsedJSON.forEach(dept => {
            dept.courses = Object.values(dept.courses[0]);
            dept.courses.forEach(course => {
                course.sections = Object.values(course.sections);
            })
        });
        let file = `${folder}${year}/${jsonfilename}.json`;
        jsonfile.writeFileSync(file, parsedJSON);
    }

    // PRIVATE
    // Used in: main
    // EFFECT: Returns array of all departments available.
    filterDeptForUndergrad(parsedJSON) {
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

    // PRIVATE
    // Used in: main
    // EFFECT: From a list of dept, creates folders in the same subdirectory as the master file.
    createFolders(array) {
        array.forEach(element => {
            let path =`${this.folder}/${this.year}/${element}`;
            fs.mkdirSync(path, { recursive: true });
        })
    }

    // PRIVATE
    // Used in: main
    // EFFECT: 
    //      1. filters for undergrad depts from deptArr
    //      2. Formats dept courses.
    //      3. Create .json files for each course.
    filterFormatWriteJSON(deptArr, parsedJSON) {
        console.log(deptArr.length);
        this.bar1.start(deptArr.length, 0);
    
        let value = 0;
        parsedJSON.forEach(dept => {
            value ++;
            if (deptArr.includes(dept.code)) {
                dept.courses.forEach(course => {
                        this.formatCourse(course);
                        let file = `${this.folder}/${this.year}/${course.subject_code}/${course.course_name}.json`;;
                        jsonfile.writeFileSync(file, course, { spaces: 2 });

                });
            }
            this.bar1.update(value, {
                percentage: (value/deptArr.length)*100
            });
    
            if (value == deptArr.length) {
                this.bar1.stop();
            }
        });
    }

    // PRIVATE
    // used in: filterAndFormatJSON
    // HELPER FUNCTION
    // EFFECT: Formats course object given, adds fields when not there.
    formatCourse(course) {
        var hasTerm1 = false;
        var hasTerm2 = false;
        var hasTerm12 = false;
        
        let availableActivity = [];
        var intMe = parseInt(course.credits.substring(course.credits.length-1, course.credits.length));
        if (intMe == NaN) {
            throw "NaN found! " + course.course_name;
        } else {
            course.credits = intMe;
        }
        
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

    // PUBLIC
    // EFFECT: Runs the app.
    main() {
        var parsedJSON = jsonfile.readFileSync(`${this.folder}/${this.year}/${this.allFileName}.json`);
        var deptArr = this.filterDeptForUndergrad(parsedJSON);
        this.createFolders(deptArr);
        this.filterFormatWriteJSON(deptArr, parsedJSON);
    }

    makeMasterFile() {
        var parsedJSON = jsonfile.readFileSync(`${this.folder}/${this.year}/${this.allFileName}.json`);
        var deptArr = this.filterDeptForUndergrad(parsedJSON);
        var obj = {};
        obj["DEPARTMENT"] = deptArr;
        var courses = {};

        parsedJSON.forEach(dept => {
            var arr = [];

            dept.courses.forEach(course => arr.push(course.course_name));
            courses[dept.code] = arr;
        });

        obj["COURSES"] = courses;
        let file = `${this.folder}/${this.year}/masterfile${this.year}.json`;;
        jsonfile.writeFileSync(file, obj, { spaces: 2 });
        console.log(obj);
    }
}

const app = new App('../data', "2020W", "2020W-ALL", false);
//app.main();
app.makeMasterFile();