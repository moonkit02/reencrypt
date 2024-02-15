document.getElementById('populateButton').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: populateInputs,
        });
    });
});

function populateInputs() {

    //TODO
    //1.fix input length - done
    //2.get salt from domain name - done
    //3.split the input into 4 matrix - 
    //4.enc the 4 matrix using salt
    //5.design a enc function, that can turn any number into desired character type
    //eg. 2342546 is seed, whats the output in lowercase

    let lower;
    let upper;
    let number;
    let character;
    let salts = [];
    const lowercaseChars = [];
    const uppercaseChars = [];
    const numberChars = [];
    const specialChars = [];

    function init() {

        // Lowercase characters in order of ASCII number
        for (let i = 97; i <= 122; i++) {
            lowercaseChars.push(String.fromCharCode(i));
        }

        // Uppercase characters in order of ASCII number
        for (let i = 65; i <= 90; i++) {
            uppercaseChars.push(String.fromCharCode(i));
        }

        // Numbers 0-9
        for (let i = 48; i <= 57; i++) {
            numberChars.push(String.fromCharCode(i));
        }

        // Special characters in order of ASCII number
        for (let i = 33; i <= 47; i++) {
            specialChars.push(String.fromCharCode(i));
        }
        for (let i = 58; i <= 64; i++) {
            specialChars.push(String.fromCharCode(i));
        }
        for (let i = 91; i <= 96; i++) {
            specialChars.push(String.fromCharCode(i));
        }
        for (let i = 123; i <= 126; i++) {
            specialChars.push(String.fromCharCode(i));
        }

    }
    
    init();

    function salting() {
        
    }

    function fix_length(inputString) {
        //This function fix the input string length to 16
        let newInputString = inputString;

        if (inputString.length < 16) {
            for (let counter = 16 - inputString.length; counter > 0; counter--) {
                newInputString += "0";
            }
            console.log(newInputString.length);
            return newInputString;
        }

        if (inputString.length > 16) {
            const first8Chars = inputString.slice(0, 8);
            const last8Chars = inputString.slice(-8);
            return first8Chars + last8Chars;
        }

        return inputString;
    }

    function to_hex(inputString) {
        const hexASCIIValues = [];
        for (let i = 0; i < 4; i++) {
            const char = inputString[i];
            const asciiValue = char.charCodeAt(0).toString(16); // Convert to hexadecimal
            hexASCIIValues.push(asciiValue);
        }

        const concatenatedHex = hexASCIIValues.join('');
        return concatenatedHex;
    }

    function enc_to_(inputString, letterList, salt) {
        //TODO: use salt to randomize the selected list
        //TODO: add option for user
        let newInputString = to_hex(inputString);
        let result = "";
        for (let i = 0; i < 4; i++) {
            let left = newInputString[i];
            let right = newInputString[newInputString.length - i - 1];

            console.log(parseInt(left, 16).toString() + parseInt(right, 16).toString());
            let newHex = (parseInt(left, 16).toString() + parseInt(right, 16).toString()).valueOf();
            let remain = newHex % letterList.length;

            console.log("Adding lowercase = ", letterList[remain]);
            
            result += letterList[remain];
        }
        console.log("Result is ", result);
        return result;
    }

    function lwr(inputString) {
        return enc_to_(inputString, lowercaseChars, salts[0]);
    }

    function upr(inputString) {
        return enc_to_(inputString, uppercaseChars, salts[1]);
    }

    function nmr(inputString) {
        return enc_to_(inputString, numberChars, salts[2]);
    }

    function chr(inputString) {
        return enc_to_(inputString, specialChars, salts[3]);
    }

    function enc(pwd, salt) {
        pwd = fix_length(pwd);
        
        lower = lwr(pwd.substring(0, 4)).toString();
        upper = upr(pwd.substring(4, 8)).toString();
        number = nmr(pwd.substring(8, 12)).toString();
        character = chr(pwd.substring(12, 16)).toString();

        //pwd is fixed, salt is hashed

        return lower + upper + number + character;
    }

    async function sha256Hash(inputString) {
        let newInputString = inputString.replace("www.","");
        newInputString = newInputString.replace(".","");

        const encoder = new TextEncoder();
        const data = encoder.encode(inputString);
        const buffer = await crypto.subtle.digest('SHA-256', data);
      
        // Convert the ArrayBuffer to a hexadecimal string
        const sha256Hash = Array.from(new Uint8Array(buffer))
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      
        console.log('SHA-256 Hash:', sha256Hash);
        //length is 64
        console.log('lenght:', sha256Hash.length);
        
        //Store into salts
        salts[0] = sha256Hash.substring(0, sha256Hash.length/4);
        salts[1] = sha256Hash.substring(sha256Hash.length/4, sha256Hash.length/2);
        salts[2] = sha256Hash.substring(sha256Hash.length/2, sha256Hash.length*3/4);
        salts[3] = sha256Hash.substring(sha256Hash.length*3/4, sha256Hash.length);

        // console.log("1st quarter", salts[0]);
        // console.log("2nd quarter", salts[1]);
        // console.log("3rd quarter", salts[2]);
        // console.log("4th quarter", salts[3]);


        return sha256Hash;
      
    }

    //This get the domain name
    const currentTabDomain = window.location.hostname;
    let hashedDomain = sha256Hash(currentTabDomain);
    //This find the location of all password input field
    const inputFields = document.querySelectorAll('input[type="text"]');
    
    // const inputFields = document.querySelectorAll('input[type="email"]');

    inputFields.forEach((input) => {
        
        input.value = enc(input.value, hashedDomain);

    });
}