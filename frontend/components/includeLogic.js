function includeHTML() {
    let element;
    let file;
    const allElements = document.getElementsByTagName("*");

    for (let i = 0; i < allElements.length; i += 1) {
        element = allElements[i];
        file = element.getAttribute("w3-include-html");

        if (file) {
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function onReadyStateChange() {
                if (this.readyState === 4) {
                    if (this.status === 200) {
                        element.innerHTML = this.responseText;
                    }
                    if (this.status === 404) {
                        element.innerHTML = "Document include Error";
                    }
                    element.removeAttribute("w3-include-html");
                    includeHTML();
                }
            };
            xhttp.open("GET", file, true);
            xhttp.send();
            return;
        }
    }
}
