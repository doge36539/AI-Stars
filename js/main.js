// js/main.js
alert("IF YOU SEE THIS, THE BRIDGE IS WORKING!");

window.onload = () => {
    const btn = document.getElementById('btn-showdown');
    if(btn) {
        btn.onclick = () => {
            alert("BUTTON CLICKED!");
            document.getElementById('screen-home').style.display = 'none';
            document.getElementById('screen-select').classList.remove('hidden');
        };
    }
};
