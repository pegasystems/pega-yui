var getElementsByQuery = function(root, query){
    var eleNodeList = root.querySelectorAll(query);
     if(eleNodeList.length==0) {
         return null;
     }else {
         var eleObjList = [];
         for(var i=0;i < eleNodeList.length;i++) {
             eleObjList.push(eleNodeList[i]);
         }
         return eleObjList;
     }
 }
 
 /**
  * @public This function is responsible for obtaining all of the iframes (embedded as well as siblings). It calls
  * a recursive private function above called _getFrameListHelper().
  * @param windowObj - the window to begin gathering the list of frames
  */
 pega.util.Dom.getFrames = function(windowObj) {
     var _getFrameListHelper = function(windowObj, windowList) {
         if (!windowList) {
             windowList = [];
         }
         windowList.push(windowObj)
 
         for(var i = 0; i < windowObj.frames.length; i++) {
             var currentWindow = windowObj.frames[i];
 
             // Checking for cross-domain iframes
             try {
                 // Checking for name to make sure it's same domain
                 // Different domains would not reveal this attribute
                 // 	BUG-431310 set currentWindow.name to allow try catch to remain after google CC minification 
                 currentWindow.name = currentWindow.name
             } catch(e) {
                 continue;
             }
             _getFrameListHelper(currentWindow, windowList);	        
         }
 
         return windowList;
     };
 
     return _getFrameListHelper(windowObj);
 }
 
 /*
  @public  - Function to get all the html elements that have the given id in their id attribute
  @param $string$id - id of the element(s) to search for
  @param $HTML Element or document$root - an html element or the document element.
  @param.optional $string$tag - The tag name of the elements being collected
  @return $array - An array of elements that have the given id in their id attribute.
  */
 pega.util.Dom.getElementsById = function(id, root, tag) {
     // Not sure of the pattern followed for 'id' value (found id's starting with '$' and '_'), hence giving fix specific to BUG-271924. Need to investigate later.
       // Previous regex: !/^[a-zA-Z$][\w:.$-]*$/ 
     if (!id || /^[0-9]/.test(id))
         return null;
     var id_uppercase = id.toUpperCase();
     if (!root) {
         root = document;
     }
     var elements = new Array();
     var bHasTag = false;
     var tagName = "";
     if (tag != null && typeof (tag) != "undefined") {
         bHasTag = true;
         if (pega.util.Event.isSafari) {
             tagName = tag.toLowerCase();
         } else {
             tagName = tag.toUpperCase();
         }
     }
     
     try{
         /*SE-21691/ BUG-197823 : This fix is purely for IPAD OS 7.0.4 version. As, querySelectorAll is returning incorrect results in this IOS version falling back to document.evaluate by throwing exception.*/
         if(navigator.userAgent.indexOf("iPad") > 0 && navigator.userAgent.indexOf("OS 7_0_4") > 0){
           if (document.evaluate) {
             var search = "";
             if (bHasTag)
               search = ".//" + tagName + "[@id]";
             else
               search = ".//*[@id]";
             var result = document.evaluate(search, root, null, 0, null);
             var elem = result.iterateNext();
             while (elem) {
               if (elem.getAttribute("id").toUpperCase() != id_uppercase) {
                 elem = result.iterateNext();
                 continue;
               }
               elements[elements.length] = elem;
               elem = result.iterateNext();
             }
           } 
           if (elements.length == 0)
             return null;
           return elements;
         } else if(typeof root.querySelectorAll != "undefined"){
                 /* BUG-224986 - START: Below changes are made to improve performance - code in catch block is consume more time than querySelectorAll */
                 var e = [];
                 if(root.getElementById && !root.getElementById(id)) {/* if there is no element with id attribute, do not execute querySelectorAll to save time */
                     return null;
                 }
                 if(id && id.indexOf(".") == -1 && id.indexOf("$") == -1 && id.indexOf("@") == -1) {/* If id has dot(.) or dollar($) then code in if block throws error so alternate is in else block */
                     e = getElementsByQuery(root,tagName+"#"+id);
                 } else {
                     e = getElementsByQuery(root,tagName+"[id='"+id+"']");
                 }
                 return e;
         } else throw "undefined";
     }catch(e){
         console.log("Exception caught in getElementsById");
     }
 };
 
 /*
  @param {String} | atr : A string representing the attribute node
  @param {String} | val : A string representing the value of the attribute node we're searching for
  @param {String} | tag (optional): The tag name of the elements being collected
  @param {String/HTMLElement} | root (optional): The HTMLElement or an ID to use as the starting point
  @return {Array} | An array of elements that have the given attribute/value pair match
  */
 
 pega.util.Dom.getElementsByAttribute = function(atr, val, tag, root) {
 
   if (!val)
         return null;
 
     if (!root)
         root = document;
 
     var tagName = "";
     if (tag != null && typeof (tag) != "undefined") {
         if (pega.util.Event.isSafari) {
             tagName = tag.toLowerCase();
         } else {
             tagName = tag.toUpperCase();
         }
     }
     try {
         if(typeof root.querySelectorAll != "undefined"){
             var elements = [];
             if(val == "*"){
                 elements = getElementsByQuery(root,tagName+"["+atr+"]");
             } else {
                 elements = getElementsByQuery(root,tagName+"["+atr+"='"+val+"']");
             }
             elements = (elements == null)?[]:elements;
             return elements;
         }
     } catch(e){
         console.log("Exception caught in getElementsByAttribute");
     } 
 
 };
 
 /* All these functions are in the pega.util.Dom class. Usage:pega.util.Dom.getInnerText(element) etc.. */
 
 /* Based on a similar extension that was written for Prototype */
 
 /**
  * Gets the InnerText of the given Element.
  * @method setInnerText
  * @param {HTMLElement) An element
  * @return {text} Text content
  */
 pega.util.Dom.getInnerText = function(element) {
     return element.innerText && !window.opera ? element.innerText
             : pega.util.Dom.findInnerText(element);
 };
 
 /**
  * Sets the given String as an InnerText of the given Element.
  * @method setInnerText
  * @param {HTMLElement) An element
  * @param {text) Text to be inserted as InnerText
  */
 
 pega.util.Dom.setInnerText = function(element, text) {
     element.textContent === undefined ? element.innerText = text : element.textContent = text;
 };
 
 /**
  * Replica for getBoundingClientRect()
  * @method getCoords
  * @param {HTMLElement) An element
  * @return {object}
  */
 pega.util.Dom.getCoords = function(element) {
     // Bug-115175 IE8 Standards Mode disregards the display:none. This is a fix for the issue.
     var visible = true;
     if (element.style.display == "none")
         visible = false;
     var coords = {
         left: 2,
         top: 2,
         right: element.offsetWidth,
         bottom: element.offsetHeight
     };
     while (element && typeof element.offsetParent != "unknown" && visible) {
         coords.left += element.offsetLeft;
         coords.top += element.offsetTop;
         element = element.offsetParent;
         if (element)
             visible = visible && element.style.display != "none";
     }
     if (visible) {
         coords.right += coords.left;
         coords.bottom += coords.top;
     } else {
         coords.right = coords.left;
         coords.bottom = coords.top;
     }
     return coords;
 };
 
 /**
  * Funtion to find the outerHTML of an Element
  * @method getOuterHTML
  * @param {element} HTML Element
  * @return the Inner HTML
  */
 pega.util.Dom.getOuterHTML = function(element) {
     if (!pega.util.Event.isIE) {
         var _emptyTags = {
             "IMG": true,
             "BR": true,
             "INPUT": true,
             "META": true,
             "LINK": true,
             "PARAM": true,
             "HR": true
         };
         var attrs = element.attributes;
         var str = "<" + element.tagName;
         for (var i = 0; i < attrs.length; i++)
             str += " " + attrs[i].name + "=\"" + attrs[i].value + "\"";
         if (_emptyTags[element.tagName])
             return str + ">";
         return str + ">" + element.innerHTML + "</" + element.tagName + ">";
     } else
         return element.outerHTML;
 };
 
 /**
  * Funtion to fire event
  * @method fireEvent
  * @param {element} HTML Element on which event has to be fired
  * @param {event} eventname eg: change
  * @return the Inner HTML
  */
 pega.util.Event.fireEvent = function(control, ev, ref) {
     if (ev.substring(0, 2).toLowerCase() == "on") {
         ev = ev.substring(2);
     }
     if (control.addEventListener) {
         if (!ref) {
             ref = window;
         }
 
         if (ev == "click" || ev == "mousedown" || ev == "mouseup" || ev == "mouseover" || ev == "mousemove" || ev == "mouseout" || ev == "dblclick") {
             var evt = ref.document.createEvent("MouseEvents");
             evt.initMouseEvent(ev, true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
         } else if (ev == "focusin" || ev == "focusout") {
             var evt = ref.document.createEvent("Events");
             evt.initEvent(ev, true, true, window, null);
         } else if (ev == "load" || ev == "unload" || ev == "abort " || ev == "error" || ev == "select" || ev == "change" || ev == "submit" || ev == "reset" || ev == "resize" || ev == "scroll" || ev == "focus" || ev == "blur") {
             var evt = ref.document.createEvent("Events");
             evt.initEvent(ev, false, false)
         } else if (ev == "DOMFocusIn" || ev == "DOMFocusOut" || ev == "DOMActivate") {
             var evt = ref.document.createEvent("UIEvents");
             evt.initUIEvent(ev, false, false, window, 1)
         }
         control.dispatchEvent(evt);
     } else if (control.attachEvent) {
         control.fireEvent("on" + ev);
     }
 };
 
 /*
  @public  - Function to get all the html elements that have the given name in their name attribute
  @param $string$elemName - name of the element(s) to search for
  @param $HTML Element or document$root - an html element or the document element.
  @param.optional $string$tag - The tag name of the elements being collected
  @return $array -  An array of elements that have the given name in their name attribute.
  */
 pega.util.Dom.getElementsByName = function(elemName, root, tag) {
     if (!elemName)
         return null;
 
     if (!root)
         root = document;
 
     var bHasTag = false;
     var tagName = "";
     if (tag != null && typeof (tag) != "undefined") {
         bHasTag = true;
         if (pega.util.Event.isSafari) {
             tagName = tag.toLowerCase();
         } else {
             tagName = tag.toUpperCase();
         }
     }
     try {
         if(typeof root.querySelectorAll != "undefined"){
             var elements = [];
             elements = getElementsByQuery(root,tagName+'[name="'+elemName+'"]');
             return elements;
         }
     } catch(e){
         console.log("Exception caught in getElementsByName");
     }   
 };
 
 /*
  @public  - Function to get all the html elements that have the given name in their id or name attribute.This function is equivalent to document.all
  @param $string$id - id of the element(s) to search for
  @param $HTML Element or document$root - an html element or the document element.
  @param.optional $string$tag - The tag name of the elements being collected
  @return $array -  An array of elements that have the given id in their id or name attribute.
  */
 pega.util.Dom.getElementsByIdOrName = function(key, root, tag) {
     if (!key)
         return null;
     if (!root)
         root = document;
 
     var elements = new Array();
     var bHasTag = false;
     var tagName = "";
     if (tag != null && typeof (tag) != "undefined") {
         bHasTag = true;
         if (pega.util.Event.isSafari) {
             tagName = tag.toLowerCase();
         } else {
             tagName = tag.toUpperCase();
         }
     }
     try{
         if(typeof root.querySelectorAll != "undefined"){
             var elements = [];
               var query = tagName+"[id='"+key+"']"+","+tagName+"[name='"+key+"']";
             elements = getElementsByQuery(root,query);
             return elements;
         } 
     } catch(e){
         console.log("Exception caught in getElementsByIdOrName");
     }
     
 
 };
 
 
 /*
  @public  - Function to get the first XmlNode that matches the XPath expression.
  @param $XML$doc - XMLDocument object
  @param $string$sXPath XPath expression.
  @return $object -   first XmlNode that matches the XPath expression.
  */
 
 pega.util.Dom.selectSingleNode = function(doc, sXPath) {
     if (typeof XPathEvaluator == "undefined") {
         var oResult = doc.selectNodes(sXPath);
         if (oResult && oResult.length > 0)
             return oResult[0];
         else
             return null;
     } else {
         var oResult = doc.evaluate(sXPath, doc, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
         if (oResult != null) {
             return oResult.singleNodeValue;
         }
     }
 
     return null;
 };
 
 
 
 /*
  @public  - Function that performs an in-place updation of a DOM element's style, preserving order and taking into consideration event groups
  @param $HTMLElement$element - element on which to add/remove style
  @param $String$eventType - the event type that triggers this change style call
  @param.optional $String$styleText - the style text to set
  @return $boolean - whether the operation is performed or not
  */
 pega.util.Dom.changeStyle = function(element, eventType, styleText) {
     // Data structure that categorises event groups - focus/iefocus/mouse, along with their intended operation - add/remove.
     // Augment this structure appropriately instead of adding conditions
     var events = {
         "focusevent": {
             "add": "focus",
             "remove": "blur"
         },
         "iefocusevent": {
             "add": "focusin",
             "remove": "focusout"
         },
         "mouseevent": {
             "add": "mouseover",
             "remove": "mouseout"
         }
     };
 
     element.styleArr = element.styleArr || []; // An array instead of  an object since we want to preserve order
     // Push default style into the array
     if (element.styleArr.length == 0) {
         element.styleArr.push({
             "eventGroup": "default",
             "style": element.style.cssText
         });
     }
 
     var addEventType = false;
     var removeEventType = false;
     var eventGroup;
     for (eventGroup in events) {
         if (events[eventGroup].add == eventType) {
             addEventType = true;
             break;
         } else if (events[eventGroup].remove == eventType) {
             removeEventType = true;
             break;
         }
     }
 
     if (addEventType) {
         element.styleArr.push({
             "eventGroup": eventGroup,
             "style": styleText
         });
     } else if (removeEventType) {
         var actionIndex = -1;
         var len = element.styleArr.length;
         for (var i = 0; i < len; i++) {
             if (element.styleArr[i].eventGroup == eventGroup) {
                 actionIndex = i;
                 break;
             }
         }
 
         if (actionIndex != -1) {
             element.styleArr.splice(actionIndex, 1);
         }
     } else {
         // Neither an add nor a remove operation. Check the events data structure
         return false;
     }
     // Creating a new style string
     var styleStr = "";
     for (var i = 0; i < element.styleArr.length; i++) {
         styleStr += ";" + element.styleArr[i].style;
     }
     element.style.cssText = styleStr;
     return true;
 }
 
 /*
  @public  - Function that removes the element from the dom
  @param $HTMLElement$element - element to be removed
  */
 pega.util.Dom.removeNode = function(element) {
     if (element.removeNode) {
         element.removeNode(true);
     } else {
         element.parentNode.removeChild(element);
     }
 }
 
 /*
  @public  - Function that gets data for drag/drop
  @param $event object $eventObj - drag event object
  */
 pega.util.Event.getDragData = function(eventObj) {
     var dataTransferObj = eventObj.dataTransfer,
             desktopWindow = pega.desktop.support.getDesktopWindow();
 
     if (!dataTransferObj)
     {
         return;
     }
     var dragDataValue = dataTransferObj.getData("Text"),
             effectAllowedValue,
             dropEffectValue = dataTransferObj.dropEffect;
     
     try {
         effectAllowedValue = dataTransferObj.effectAllowed;
     } catch(ex) {}
 
     if (!dragDataValue)
     {
         dragDataValue = desktopWindow.dragData;
     }
     if (!effectAllowedValue || effectAllowedValue.toLowerCase() == "none")
     {
         effectAllowedValue = desktopWindow.effectAllowed;
     }
     if (!dropEffectValue || dropEffectValue.toLowerCase() == "none")
     {
         dropEffectValue = desktopWindow.dropEffect;
     }
 
     return {
         dragData: dragDataValue,
         effectAllowed: effectAllowedValue,
         dropEffect: dropEffectValue
     };
 }
 
 /*
  @public  - Function that sets data for drag/drop
  @param $event object $eventObj - drag-event object
  @param $object $obj - object that holds drag event data
  */
 pega.util.Event.setDragData = function(eventObj, obj) {
     var dataTransferObj,
             desktopWindow = pega.desktop.support.getDesktopWindow();
     if (eventObj)
     {
         dataTransferObj = eventObj.dataTransfer;
     }
     if (!obj)
     {
         desktopWindow.dragData = null;
         desktopWindow.effectAllowed = null;
         desktopWindow.dropEffect = null;
         return;
     }
     if (!dataTransferObj)
     {
         return;
     }
     if (obj.dragData !== undefined)
     {
         dataTransferObj.setData("Text", obj.dragData);
         desktopWindow.dragData = obj.dragData;
     }
     if (obj.effectAllowed)
     {
         dataTransferObj.effectAllowed = obj.effectAllowed;
         desktopWindow.effectAllowed = obj.effectAllowed;
     }
     if (obj.dropEffect)
     {
         dataTransferObj.dropEffect = obj.dropEffect;
         desktopWindow.dropEffect = obj.dropEffect;
     }
 
 };
 //static-content-hash-trigger-GCC