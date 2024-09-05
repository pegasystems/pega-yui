pega.util.Dom.getElementsBy = function(method, tag, root, apply) {
    tag = tag || '*';

    if (typeof root == "string" || !root) { // id or null
        root = document.getElementById(root);
    }
    if (!root) {
        root = document;
    }
    var nodes = [],
        elements = root.getElementsByTagName(tag);
    
    for (var i = 0, len = elements.length; i < len; ++i) {
        if ( method(elements[i]) ) {
            nodes[nodes.length] = elements[i];
            if (apply) {
                apply(elements[i]);
            }
        }
    }

    
    return nodes;
}

/*
@public  - Function to removae all the html elements with a given tag name.  This function wraps Dom.getElementsBy(....)
@param method <Function> - A boolean method for testing elements which receives the element as its only argument.
@param tag <String> (optional) The tag name of the elements being collected
@param root <String | HTMLElement> (optional) The HTMLElement or an ID to use as the starting point
@param apply <Function> (optional) A function to apply to each element when found
@return $object$ Array of HTMLElements
*/
pega.util.Dom.removeElements = function(method, tag, root, apply) {

arrEl = pega.util.Dom.getElementsBy(method, tag, root, apply);
for (i = arrEl.length; i > 0; i--) {
arrEl[i - 1].parentNode.removeChild(arrEl[i - 1]);
arrEl[i - 1] = null;
}

}

/**
* Remove the Scripts
* @method stripScripts
* @param {htmlText} HTML Text
* @return the Modified HTMLText
*/
pega.util.Dom.stripScripts = function(htmlText) {
return htmlText.replace(new RegExp('(?:<script.*?>)((\n|\r|.)*?)(?:<\/script>)', 'img'), '');
};

/**
* Returns the unescape HTML
* @method unescapeHTML
* @param {htmlTextVal} HTML Text
* @return the unescape HTML
*/
pega.util.Dom.unescapeHTML = function(htmlTextVal) {
var div = document.createElement('div');
div.innerHTML = pega.util.Dom.stripTags(htmlTextVal);
var childArray = new Array(div.childNodes);

return div.childNodes[0] ? (div.childNodes.length > 1 ?
    pega.util.Dom.inject(childArray, '', function(memo, node) {
        return memo + node.nodeValue
    }) : div.childNodes[0].nodeValue) : '';
};

/**
* @method stripTags
* @param {textVal}
* @return the HTML with out tags
*/
pega.util.Dom.stripTags = function(textVal) {
return textVal.replace(/<\/?[^>]+>/gi, '');
};

pega.util.Dom.inject = function(childNodeArray, memo, iterator) {
childNodeArray.each(function(value, index) {
memo = iterator(memo, value, index);
});
return memo;
};

/**
* Function to find the innerText of an Element
* @method findInnerText
* @param {element} HTML Element
* @return the innerText
*/
pega.util.Dom.findInnerText = function(element) {
var html = pega.util.Dom.stripScripts(element.innerHTML);
var escapeHTML = pega.util.Dom.unescapeHTML(html);
return escapeHTML.replace(/[\n\r\s]+/g, ' ');
};

pega.util.Dom.clearEvents = function(oRoot, bRecursive) {

clearEventProps =
    function(oEl) {
        for (propName in oEl) {
            if (propName.indexOf("on") != -1) {
                try {
                    // set value
                    var prop = eval("oEl." + propName + "=" + value);
                } catch (e) {
                }
            }
        }
    }

innerClearEvents =
    function(root, value, bRecursive) {

        var oEls = $(root).children();
        for (var i = 0; i < oEls.length; i++) {
            var oEl = oEls[i];
            if (bRecursive) {
                if ($(oEl).children().first()[0]) {
                    innerClearEvents(oEl, value, bRecursive);
                }
            }

            clearEventProps(oEl);
        }
    }

if (arguments.length < 2) {
bRecursive = false;
}

if (pega.lang.isObject(oRoot.forms) && pega.lang.isObject(oRoot.anchors)) {
oRoot = oRoot.getElementsByTagName("HTML")[0];
}

var oEls = $(oRoot).get();
if (pega.lang.isArray(oEls)) {
for (var i = 0; i < oEls.length; i++) {
    var oEl = oEls[i];
    innerClearEvents(oEl, null, bRecursive);
    clearEventProps(oEl);
}
} else {
innerClearEvents(oEls, null, bRecursive);
clearEventProps(oEls);
}

}

/* takes an element and updated its innerHTML by brute force.
@param Object$inputField - element whoose innerHTML has to be updated

*/
pega.util.Dom.updateInnerHTML = function(inputField) { // if the inputField ID string has been passed in, get the inputField object
if (typeof inputField === "string") {
inputField = document.getElementById(inputField);
}
if (inputField.type === "select-one") {
while (inputField.options === undefined) {
    var opts = inputField.options;
}
var salIndex = inputField.selectedIndex;
for (var i = 0; i < inputField.options.length; i++) {
    if (i !== salIndex && (inputField.options[i].getAttribute("selected") != null)) {
        inputField.options[i].attributes.removeNamedItem("selected");
    }
    if (i === salIndex) {
        inputField.options[salIndex].setAttribute("selected", "selected");
    }
}
} else if (inputField.type === "text") {
inputField.setAttribute("value", inputField.value);
} else if (inputField.type === "textarea") {
/*BUG-120111: If the content inside text area has any tags, then in IE innerHTML returns errors. So, using innerText only in IE. */
if (pega.util.Event.isIE) {
    inputField.innerText = inputField.value;
} else {
    inputField.innerHTML = inputField.value;
}
//inputField.setAttribute("value",inputField.value);
} else if ((inputField.type === "checkbox") || (inputField.type === "radio")) {
if (inputField.checked) {
    inputField.setAttribute("checked", "checked");
} else {
    inputField.removeAttribute("checked");
}
}
};

/* gets all the input,select and textarea in passed element
updates innerHTML of all elements by brute force
required for Firefox and Safari (IE handles this on it's own)
@param Object$elem - element holding all input,select and textarea elements
*/

pega.util.Dom.updateInnerHTMLForFields = function(elem) {
var inputEle = elem.getElementsByTagName('input');
var selectEle = elem.getElementsByTagName('select');
var textAreaEle = elem.getElementsByTagName('textarea');
var field_sets = new Array(inputEle, selectEle, textAreaEle);
for (var x = 0; x < field_sets.length; x++) {
var set = field_sets[x];
for (var y = 0; y < set.length; y++) {
    pega.util.Dom.updateInnerHTML(field_sets[x][y]);
}
}
};
//static-content-hash-trigger-GCC