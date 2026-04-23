//Header für HTML file mit Bootstrap

// --- Meta: charset ---
//erstellt html Element:
const metaCharset = document.createElement("meta");
//setzt Attribute in html Element:
metaCharset.setAttribute("charset", "UTF-8");
//prepend bindet element im head ein (muss zuoberst eingebunden werden!!!)
document.head.prepend(metaCharset);
/*
Rest mit selber Logik eingebunden, mit dem Unterschied, dass sie
mit appendChild eingebunden sind.
(Charset muss immer zuerst im head angegeben werden!!)
*/

// --- Meta: viewport ---
const metaViewport = document.createElement("meta");
metaViewport.setAttribute("name", "viewport");
metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0");
document.head.appendChild(metaViewport);

// --- Bootstrap 5 CSS ---
const bootstrapCSS = document.createElement("link");
bootstrapCSS.setAttribute("rel", "stylesheet");
bootstrapCSS.setAttribute(
    "href",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
);
document.head.appendChild(bootstrapCSS);