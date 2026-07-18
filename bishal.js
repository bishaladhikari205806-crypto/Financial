  

            const FINANCE_FORM = document.getElementById('financeform');
            const TYPE_INPUT= document.getElementById('Type');
            const WALLET_INPUT = document.getElementById('Wallet');
            const AMOUNT_INPUT = document.getElementById('Amount');
            const SOURCE_INPUT = document.getElementById('Source'); 

            const PREVIEW_BUTTON = document.getElementById('previewBtn');    
            const PREVIEW_BOX = document.getElementById('previewbox'); 
            const SUBMIT_BUTTON = document.getElementById('submitBtn');

            const API_URL = "https://api.sheetbest.com/sheets/77a433dc-9658-4976-a63f-10161078e9a1";

            PREVIEW_BUTTON.addEventListener('click', function(){
                     const TRANSACTION_TYPE = TYPE_INPUT.value;
                     const PAYMENT_METHOD = WALLET_INPUT.value;
                     const AMOUNT_VALUE = AMOUNT_INPUT.value || "0.00";
                     const SOURCE_VALUE = SOURCE_INPUT.value || "Not specified";               
            

           const ACCENT_COLOR = (TRANSACTION_TYPE === "Income") ? "#28a745" : "#dc3545";

           PREVIEW_BOX.style.display = "block";
    PREVIEW_BOX.innerHTML = `
        <div style="text-align: center; border-bottom: 2px dashed #DDDDDD; padding-bottom: 5px; margin-bottom: 12px;">
            <b style="color: white; font-size: 18px;">TRANSACTION PREVIEW</b>
        </div>
        <b> Flow Type:</b> <span style="color: ${ACCENT_COLOR}; font-weight: bold;">${TRANSACTION_TYPE}</span><br>
        <b> Wallet/Bank:</b> ${PAYMENT_METHOD}<br>
        <b> Net Amount:</b> <span style="font-weight: bold; color: ${ACCENT_COLOR};">Rs. ${AMOUNT_VALUE}</span><br>
        <b> Source/Ref:</b> ${SOURCE_VALUE}
       
    `;
});
            FINANCE_FORM.addEventListener('submit', function(EVENT) {
                EVENT.preventDefault();

            const TODAY = new Date();
            const FORMATTED_DATE = TODAY.toISOString().split('T')[0];

            const DATA_TO_SEND = {
        Date: FORMATTED_DATE,
        Type: TYPE_INPUT.value,
        Wallet: WALLET_INPUT.value,
        Amount: AMOUNT_INPUT.value,
        Source: SOURCE_INPUT.value
    };
    SUBMIT_BUTTON.innerText = "Your Balance Recorded, SEE YOU AGAIN";
    SUBMIT_BUTTON.disabled = true;

    fetch(API_URL, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DATA_TO_SEND)
    })

    .then(RESPONSE => {
        if(RESPONSE.ok) {
           
            alert("Your Balance Recorded, SEE YOU AGAIN");
            FINANCE_FORM.reset();               
            PREVIEW_BOX.style.display = "none"; 
        } else {
           
            alert("API Connection Error. Verify your Sheet Best URL.");
        }
    })
    .catch(ERROR => {
      
        alert("Network Error: Unable to connect to the database.");
        console.error("DEBUG LOG:", ERROR);
    })
    .finally(() => {
      
        SUBMIT_BUTTON.innerText = "submit";
        SUBMIT_BUTTON.disabled = false;
    });
});