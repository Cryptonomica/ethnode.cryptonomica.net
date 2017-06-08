pragma solidity ^0.4.11;


contract Verificator {

    // verifications: (acc => (verificationId => verificactioData)
    mapping (address => mapping (uint => Verification)) public verification;
    // counter for verifications for acc
    mapping (address => uint) numberOfVerifications; // this number is verification Id
    // ---------
    // administrative variables:
    mapping (address => bool) public isManager;
    address owner;

    /* Constructor: */
    function Verificator(){
        owner = msg.sender;
    }

    /* Verification struct: */
    struct Verification {
    // this is created when user requests string to sign
    bytes32 stringToSign;
    // this is signed string that have to be added by user
    string signedString;
    bool signedStringUploaded;
    // information that have to be added from the cryptonomica server:
    // string signedStringFromServer;
    string firstName;
    string lastName;
    string keyFingerprint;
    uint keyValidUntil; // unix time
    uint birthDateYear;
    uint birthDateMonth;
    uint birthDateDay;
    }

    // get unique string for verification request:
    function getStringToSignWithKey(string keyFingerprint) returns (bytes32) {
        bytes32 strToSign = sha3(// alias to keccak256(), returns (bytes32)
        msg.sender,
        block.blockhash(block.number),
        block.timestamp,
        block.blockhash(block.number - 250)
        );
        uint verificationId = numberOfVerifications[msg.sender]++;
        verification[msg.sender][verificationId].stringToSign = strToSign;
        verification[msg.sender][verificationId].keyFingerprint = keyFingerprint;
        StringToSignRequested(msg.sender, keyFingerprint, verificationId, strToSign);
        return strToSign;
    }

    event StringToSignRequested(address forAccount,
    string forKeyFingerpint,
    uint AccountVerificationId,
    bytes32 stringToSign
    );

    // -------------
    function uploadSignedString(uint verificationId, string signedString) returns (bool){

        if (verification[msg.sender][verificationId].signedStringUploaded) {
            SignedStringUploaded(msg.sender, verificationId, false, "signed string for this verification id is already uploaded", signedString);
            return false;
        }

        verification[msg.sender][verificationId].signedString = signedString;
        verification[msg.sender][verificationId].signedStringUploaded = true;
        SignedStringUploaded(msg.sender, verificationId, true, "success", signedString);
        return true;
    }

    event SignedStringUploaded(address fromAccount, uint verificationId, bool result, string message, string signedString);
    // -----------

    function verify(

    address acc,
    uint verificationId,
    string firstName,
    string lastName,
    uint keyValidUntil, // unix time
    uint birthDateYear,
    uint birthDateMonth,
    uint birthDateDay,
    string keyFingerprint
    ) returns (bool){

        if (!isManager[msg.sender]) {
            throw;
        }

        //
        // bytes32 stringToSign; //
        // string signedString; //
        // string keyFingerprint;
        // bool signedStringUploaded; //

        // information that have to be added from the cryptonomica server:
        verification[acc][verificationId].firstName = firstName;
        verification[acc][verificationId].lastName = lastName;
        verification[acc][verificationId].keyValidUntil = keyValidUntil;
        verification[acc][verificationId].birthDateYear = birthDateYear;
        verification[acc][verificationId].birthDateMonth = birthDateMonth;
        verification[acc][verificationId].birthDateDay = birthDateDay;

        VerificationAdded(
        acc,
        firstName,
        lastName,
        birthDateYear,
        birthDateMonth,
        birthDateDay,
        keyFingerprint,
        keyValidUntil // unix time
        );
        return true;

    }

    event VerificationAdded (
    address verifiedAccount,
    string firstName,
    string lastName,
    uint birthDateYear,
    uint birthDateMonth,
    uint birthDateDay,
    string keyFingerprint,
    uint keyValidUntil // unix time
    );

    // ---------------

    /* administrative functions: */
    function addManager(address acc) returns (bool){
        if (msg.sender != owner) {
            throw;
        }
        isManager[acc] = true;
        ManagerAdded(acc, msg.sender);
        return true;
    }

    event ManagerAdded (address added, address addedBy);

    function removeManager(address manager) returns (bool){
        if (msg.sender != owner) {
            throw;
        }
        isManager[manager] = false;
        ManagerRemoved(manager, msg.sender);
        return true;
    }

    event ManagerRemoved(address removed, address removedBy);

}

