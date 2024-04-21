document.getElementById('populateButton').addEventListener('click', () => {
    console.log("executing...");
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: populateInputs
        });
    });
});

async function populateInputs() {

    let lower;
    let upper;
    let number;
    let character;
    let salts = [];

    const currentTabDomain = window.location.hostname;
    var sha256HashedDomain = "";
    let fixedLengthAdder = "msifjxowumqhysap"; //Default random 16 characters words
    const lowercaseChars = [];
    const uppercaseChars = [];
    const numberChars = [];
    const specialChars = ['!', '@', '$', '%', '^', '&', '*', '+', '#'];

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

        // Special characters without order
        // Since some of the characters are not allowed, thus it is defined manually

    }

    init();

    //Start hashing and assign values to salt
    //Here will asign value to hashed domain and salts array
    let newInputString = currentTabDomain.replace("www.", "");
    newInputString = newInputString.replace(".", "");

    const encoder = new TextEncoder();
    const data = encoder.encode(currentTabDomain);
    const buffer = await crypto.subtle.digest('SHA-256', data);

    //Convert the ArrayBuffer to a hexadecimal string
    sha256HashedDomain = Array.from(new Uint8Array(buffer))
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');

    console.log('SHA-256 Hash:', sha256HashedDomain);

    //Length is 64
    console.log('lenght:', sha256HashedDomain.length);

    //Store into salts
    salts[0] = sha256HashedDomain.substring(0, sha256HashedDomain.length / 4);
    salts[1] = sha256HashedDomain.substring(sha256HashedDomain.length / 4, sha256HashedDomain.length / 2);
    salts[2] = sha256HashedDomain.substring(sha256HashedDomain.length / 2, sha256HashedDomain.length * 3 / 4);
    salts[3] = sha256HashedDomain.substring(sha256HashedDomain.length * 3 / 4, sha256HashedDomain.length);

    function fix_length(inputString) {
        //This function fix the input string length to 16
        let newInputString = inputString;

        console.log("fixedLengthAdder size |" + fixedLengthAdder.length);
        if (fixedLengthAdder.length < 16) {
            alert("Wordlist for fixed length adder is not long enough, please ensure it is atleast 16 characters long");
            exit;
        }

        if (inputString.length < 16) {
            for (let counter = 16 - inputString.length; counter > 0; counter--) {
                newInputString += fixedLengthAdder[counter];
                console.log("fix_length | newInputString: ", newInputString);
            }
            console.log("fix_length | newInputString | add | done: ", newInputString);
            return newInputString;
        }

        if (inputString.length > 16) {
            const first8Chars = inputString.slice(0, 8);
            const last8Chars = inputString.slice(-8);
            console.log("fix_length | newInputString | substract | done: ", newInputString);
            return first8Chars + last8Chars;
        }

        console.log("fix_length | newInputString | fulfilled | done: ", newInputString);
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

    function enc_to_(inputString, letterList, section) {

        let substringHead = 32;
        let divider = 13;

        inputString = to_hex(fix_length(inputString));
        console.log("enc_to() | inputString:", inputString);
        console.log("enc_to() | sha256HashedDomain:", sha256HashedDomain);

        let salt = 0;
        switch (section) {
            case 1:
                console.log("enc_to() | section 1");
                console.log("enc_to() | substring 1:", sha256HashedDomain.substring(substringHead, substringHead + 4));
                salt = parseInt(sha256HashedDomain.substring(substringHead, substringHead + 4)) & divider;
                console.log("enc_to() | substring 1:", salt);
                break;
            case 2:
                console.log("enc_to() | section 2");
                console.log("enc_to() | substring 2:", sha256HashedDomain.substring(substringHead + 4, substringHead + 8));
                salt = parseInt(sha256HashedDomain.substring(substringHead + 4, substringHead + 8)) & divider;
                console.log("enc_to() | substring 1:", salt);
                break;
            case 3:
                console.log("enc_to() | section 3");
                console.log("enc_to() | substring 3:", sha256HashedDomain.substring(substringHead + 8, substringHead + 12));
                salt = parseInt(sha256HashedDomain.substring(substringHead + 8, substringHead + 12)) & divider;
                console.log("enc_to() | substring 1:", salt);
                break;
            case 4:
                console.log("enc_to() | section 4");
                console.log("enc_to() | substring 4:", sha256HashedDomain.substring(substringHead + 12, substringHead + 16));
                salt = parseInt(sha256HashedDomain.substring(substringHead + 12, substringHead + 16)) & divider;
                console.log("enc_to() | substring 1:", salt);
                break;
            default:
                console.log("enc_to() | error");
                break;
        }

        console.log("enc_to() | salt", salt);

        let result = "";

        for (let i = 0; i < 4; i++) {
            let left = inputString[i];
            let right = inputString[inputString.length - i - 1];

            console.log("enc_to() | Combining: ", parseInt(left, 16).toString() + parseInt(right, 16).toString());

            let newHex = (parseInt(left, 16).toString() + parseInt(right, 16).toString()).valueOf();
            // let remain = (newHex.valueOf() + salts[i - 1].valueOf()) % letterList.length;
            let remain = (newHex.valueOf() + parseInt(salts[section - 1], 16)) % letterList.length;

            if (result.includes(letterList[remain])) {
                console.log("enc_to() | repeated");
                remain = (newHex.valueOf() + parseInt(salts[section - 1], 16) + salt++) % letterList.length;

            }

            console.log("enc_to() | salts: ", parseInt(salts[section - 1], 16));
            console.log("enc_to() | remain: ", remain);
            console.log("enc_to() | Adding character: ", letterList[remain]);

            result += letterList[remain];
        }
        console.log("enc_to():", result);
        return result;
    }

    function enc(pwd) {
        console.log("enc(pwd):start");
        console.log("enc(pwd) | sha256HashedDomain:", sha256HashedDomain);
        console.log("enc(pwd) | pwd:", pwd);

        pwd = fix_length(pwd);

        console.log("enc(pwd) | pwd.substring(0, 4):", pwd.substring(0, 4));
        lower = enc_to_(pwd.substring(0, 4), lowercaseChars, 1).toString();

        console.log("enc(pwd) | pwd.substring(4, 8):", pwd.substring(4, 8));
        upper = enc_to_(pwd.substring(4, 8), uppercaseChars, 2).toString();

        console.log("enc(pwd) | pwd.substring(8, 12):", pwd.substring(8, 12));
        number = enc_to_(pwd.substring(8, 12), numberChars, 3).toString();

        console.log("enc(pwd) | pwd.substring(12, 16):", pwd.substring(12, 16));
        character = enc_to_(pwd.substring(12, 16), specialChars, 4).toString();

        //pwd is fixed, salt is hashed
        console.log("enc(pwd) | Lower:", lower);
        console.log("enc(pwd) | Upper:", upper);
        console.log("enc(pwd) | Number:", number);
        console.log("enc(pwd) | Character:", character);

        console.log("enc(pwd):end");
        return lower + upper + number + character;
    }

    //This find the location of all password input field

    const inputFields = document.querySelectorAll('input[type="password"]');

    if (inputFields.length < 1) {
        alert("No password field is detected!!!");
        exit;
    }

    inputFields.forEach((input) => {

        if(input.value == ""){
            alert("One of the input field is empty, at least input something before proceed to encrypt it.");
            exit;
        }
        input.value = enc(input.value);

    });

    alert("Encrypted successfully, please proceed to manually type something then remove it from the password field. ");
}