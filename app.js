const fs = require('fs');
const mkdirp = require('mkdirp');

const rawdata = fs.readFileSync('2020W.json');
const UBC = JSON.parse(rawdata);

const filteredUndergrad = filter_for_Undergrad();        //arr

// const allDept = allDepartments();                        //arr
// "2020W_Department_Undergrad.json"

const allDeptCode = allDepartmentCodes();
// create_FOLDERS_from_arr(allDeptCode);
// create_MASTERFILE_from_filteredUndergrad();


function filter_for_Undergrad() {
    let courseArr = [];

    UBC.forEach(element => {
        if (parseInt(element.courses[0]) < 499) {
            courseArr.push(element);
        }
    });

    return courseArr;
}

function allDepartments() {
    let departmentArr = [];

    filteredUndergrad.forEach(element => {
        if (!departmentArr.includes(element.faculty)) {
            departmentArr.push(element.faculty);
        }
    });

    return departmentArr;
}

function allDepartmentCodes() {
    let departmentArr = [];

    filteredUndergrad.forEach(dep => {
        if (!departmentArr.includes(dep.code)) {
            departmentArr.push(dep.code);
        }
    });

    return departmentArr;
}

function create_FILE_from_arr(filename, array) {
    const file = './data/' + filename;
    const jsonContent = JSON.stringify(array);

    fs.writeFile(file, jsonContent, 'utf8', (err) => {
        if (err) console.log(err);
        console.log("The file was saved!");
    })
}

function create_FOLDERS_from_arr(arr) {
    arr.forEach(element => {
        let dir = './data/' + element;
        mkdirp(dir)
        .then(console.log('success!'))
        .catch(err => console.error(err)); 
    })

}

function create_MASTERFILE_from_filteredUndergrad() {
   
    filteredUndergrad.forEach(element => {
        let file = `./data/${element.code}/MASTER.json`;
        let jsonContent = JSON.stringify(element);

        fs.writeFile(file, jsonContent, 'utf8', (err) => {
            if (err) console.log(err);
            console.log("The file was saved!");
        });
    })
}

function create_COURSE_SECTION_FILE() {
    
}