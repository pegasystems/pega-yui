/*
 Change #1 :Updated proto.DOMEventHandler() to resolve the click event issue in the Accordion content Div

 Change#2 : Added harness wevent handler for handling both window resize and layout resize
 */

 pega.namespace("pega.ui");

 (function() {
 
     /**
      * The tabview module provides a widget for managing content bound to tabs.
      * @module tabview
      * @requires pega, dom, event, element
      *
      */
     /**
      * A widget to control tabbed views.
      * @namespace pega.ui
      * @class TabView
      * @extends pega.util.Element
      * @constructor
      * @param {HTMLElement | String | Object} el(optional) The html
      * element that represents the TabView, or the attribute object to use.
      * An element will be created if none provided.
      * @param {Object} attr (optional) A key map of the tabView's
      * initial attributes.  Ignored if first arg is attributes object.
      */
 
     pega.ui.TabView = function(el, attr) {
         attr = attr || {};
         if (arguments.length == 1 && !pega.lang.isString(el) && !el.nodeName) {
             attr = el; // treat first arg as attr object
             el = attr.element || null;
         }
 
         if (!el && !attr.element) { // create if we dont have one
             el = _createTabViewElement.call(this, attr);
         }
         this._left = 0;
         this._menuButtonListWidth = null;
         this._currentMenuButtonWidth = 0;
         this._tabContainerWidth = null;
         this.isDCTabView = false;
         pega.ui.TabView.superclass.constructor.call(this, el, attr);
         if (this._scrollContainer && this._isHorizontal) {
             this._hideScrollers = this._scrollContainer.getAttribute('data-hide-tab-scroll');
             this._initEvents();
             this._setLastOffset();
             //oldWidth was used to set a conditional call to resizeTabScroll in the TabView resize handler
             //We are turning off this condition. So no need to calculate this
             //this._oldWidth = this._contentParent.parentNode.offsetWidth;
         }
     };
 
     pega.extend(pega.ui.TabView, pega.util.Element);
 
     var proto = pega.ui.TabView.prototype;
     var Dom = pega.util.Dom;
     var Event = pega.util.Event;
     var Tab = pega.ui.Tab;
 
     //Moving this functionality outside the initEvents method so it can leverage isDCTabView optimiztion
     //Currently this info is not available at the time of object instantiation.
     //TODO: possible scope for rewrite here to get this information to the contructor.
     proto.setHarnessHeaderIconsHeightWidth = function() {
         var isFormatSubTabbed, processFurther, ele;
         ele = this.get("element");
         if (ele) {
             isFormatSubTabbed = Dom.hasClass(ele, "subTabbed");
         }
         processFurther = false;
         if (this._harnessHeaderIcons && ((!this.isDCTabView) || (this.isDCTabView && isFormatSubTabbed))) {
             processFurther = true;
         }
         if (processFurther) {
             var tabsUL = this._tabParent;
             if (tabsUL && tabsUL.offsetHeight != 0) {
                 //var tabsULHeight = tabsUL.offsetHeight + "px";
                 // Initialize width and height dynamicly.
                 //this._harnessHeaderIcons.style.height = Event.isIE ? (parseInt(tabsULHeight, 10) - 2 + "px") : tabsULHeight;
                 this._harnessHeaderIcons.style.height = tabsUL.lastChild.offsetHeight + "px";
             }
             this._harnessHeaderIcons.style.width = this._harnessHeaderIcons.firstChild.offsetWidth + "px";
         }
     }
 
     proto._initEvents = function() {
         var tabsUL = this._tabParent;
         /* ---------
          //perf mod -  moved the initialization of harness header icon
          //to outside tabview construction code and into the tabsupprt
          //initializeTabs method using using setHarnessHeaderIconsHeightWidth
          //
          // BUG-70791 START
          if (this._harnessHeaderIcons) {
 
          if(tabsUL && tabsUL.offsetHeight != 0){
          //var tabsULHeight = tabsUL.offsetHeight + "px";
          // Initialize width and height dynamicly.
          //this._harnessHeaderIcons.style.height = Event.isIE ? (parseInt(tabsULHeight, 10) - 2 + "px") : tabsULHeight;
          this._harnessHeaderIcons.style.height = tabsUL.lastChild.offsetHeight + "px";
          }
          this._harnessHeaderIcons.style.width = this._harnessHeaderIcons.firstChild.offsetWidth + "px";
          }
          perf mod end
          --------  */
         // BUG-70791 END
         if (this._menuButton) {
             Event.addListener(this._menuButton, 'click', this.showTabsMenu, null, this);
             Event.addListener(this._menuButton, 'keydown', this.showTabsMenu, null, this);
             if (Event.isIE) {
                 this._menuButton.parentNode.onselectstart = function() {
                     return false;
                 };
             }
             this.objMenuXML = pega.tools.XMLDocument.get();
             this.onBeforeShowMenu = new pega.util.CustomEvent("onBeforeShowMenu", this);
         }
 
         var that = this;
         this.on("activeTabChange", this.focusActiveTab, null, this);
         //HFix-20746
         pega.u.d.registerResize(function() {
             if (!that.isDCTabView) {
                 if (that._harnessHeaderIcons && that._harnessHeaderIcons.offsetWidth != that._harnessHeaderIcons.firstChild.offsetWidth) {
                     that._harnessHeaderIcons.style.width = that._harnessHeaderIcons.firstChild.offsetWidth + "px";
                 }
             }
             window.setTimeout(function() {
                 /* if ( that._contentParent && that._contentParent.parentNode ) {
                  //	var newWidth = that._contentParent.parentNode.offsetWidth;
                  //	if (newWidth != that._oldWidth) {
                  //		that._oldWidth = newWidth;*/
                 if (!that.isDCTabView) {
                     that.resizeTabsScroll();
                 }
                 /* 	}
                  //}*/
             }, 5);
 
         });
         //Required  - these resize calls are attached to different events and
         //are required for different scenarios
         //We will optimize the toggleQuickMenu itself or totally turn it off
         //At that point we can remove these
         pega.ui.d.attachOnload(function() {
             that._toggleQuickMenu();
         }, false);
         /* BUG-118069, BUG-177986 */
         Event.addListener(window, 'resize', function() {
             //HFix-20746
             if (that.isDCTabView) {
                 that.resizeTabsScroll();
             } else {
                 that._toggleQuickMenu();
             }
         }, null, this);
         /* BUG-118069, BUG-177986 */
     };
 
     proto.resizeTabsScroll = function() {
         //BUG-64430 3/13/2012 Script Error when loading portals
         if (this._scrollContainer && this._isHorizontal) {
             //HFix-20746
             if (!this.isDCTabView) {
                 this._setLastOffset();
             }
             this._resizeScrollContainer();
             this.hideTabsMenu();
             this._toggleQuickMenu();
         }
         //BUG-64430 3/13/2012 Script Error when loading portals
     }
 
     pega.ui.TabView.selectTab = function(index) {
         var tabView = pega.ui.TabView.activeTabView;
         tabView.set("activeTab", tabView.getTab(index));
     };
 
     pega.ui.TabView.activeTabView = null;
 
     proto.hideTabsMenu = function() {
         pega.ui.TabView.activeTabView = this;
         if (this.currentlyOpenedMenus) {
             this.currentlyOpenedMenus._hideAll();
         }
     }
 
     proto.showTabsMenu = function(e) {
         //If the keydown event is not from enter or space then ignore it.
         if (e.type == "keydown" && !(e.keyCode == 13 || e.keyCode == 32)) {
             return;
         }
         var activeTabView = pega.ui.TabView.activeTabView;
         if (activeTabView && activeTabView.currentlyOpenedMenus) {
             activeTabView.currentlyOpenedMenus._hideAll();
         }
         pega.ui.TabView.activeTabView = this;
 
         this.currentlyOpenedMenus = new pega.ui.menubar.Manager();
 
         var tabStrip = this._tabParent.parentNode,
                 scrollContainerWidth = tabStrip.offsetWidth,
                 scrollLeft = Math.abs(this._left),
                 leftOffset = scrollLeft + scrollContainerWidth,
                 aTabs = this.get("tabs"),
                 activeIndex = this.get("activeIndex"),
                 dataXML = "<pagedata>\n<Menu>",
                 tabsLength = (this._tabPos == "Top") ? aTabs.length - 1 : aTabs.length,
                 ln = 4; // ln is the length of the longest title.
         if (!Event.isIE || pega.u.d.inStandardsMode)
             this._fixTabsDisplay("inline-block"); // BUG-73011 : This will help to get correct offset values
         for (var i = 0; i < tabsLength; i++) {
             var oTab = aTabs[i],
                     styleOverrides = {},
                     leftStyleOverrides = {},
                     tabEl = oTab.get("element"),
                     itemLeft = tabEl.offsetLeft,
                     itemWidth = tabEl.offsetWidth,
                     itemOffset = itemLeft + itemWidth,
                     /* BUG-102407 GUJAS1 05/15/2013 Send tab instance */
                     tabIconLabelTooltip = this.getTabLabelIconAndTooltip(tabEl, oTab),
                     icon = tabIconLabelTooltip.icon,
                     imageClass = "",
                     styleString = "",
                     leftStyleString = "",
                     activeStyle = "",
                     label = tabIconLabelTooltip.label || tabIconLabelTooltip.tooltip || "",
                     strToolTip = tabIconLabelTooltip.tooltip || tabIconLabelTooltip.label || "",
                     strValue = label;
 
             if (itemLeft < scrollLeft || itemOffset > leftOffset) {
                 styleOverrides["background-color"] = "#dbdbdb";
                 leftStyleOverrides["background-color"] = "#dbdbdb";
             }
 
             if (activeIndex == i) {
                 styleOverrides["font-weight"] = "bold";
                 leftStyleOverrides["font-weight"] = "bold";
             }
             if (icon) {
                 leftStyleOverrides["background-image"] = "url('" + icon + "')";
                 leftStyleOverrides["background-repeat"] = "no-repeat";
                 leftStyleOverrides["background-position"] = "center";
                 imageClass = "tabsMenuEmptyImageDiv";
             }
             for (var o in styleOverrides) {
                 styleString += o + ":" + styleOverrides[o] + ";";
             }
             for (var lo in leftStyleOverrides) {
                 leftStyleString += lo + ":" + leftStyleOverrides[lo] + ";";
             }
             if (leftStyleString.length > 0) {
                 activeStyle += ("leftstyle = \"" + leftStyleString + "\"");
             }
             if (styleString.length > 0) {
                 activeStyle += (" middlestyle = \"" + styleString + "\" rightstyle = \"" + styleString + "\"");
             }
 
             if (label.length > 16) {
                 label = label.substring(0, 13) + "...";
             }
             if (label.length > ln) {
                 ln = label.length;
             }
             strValue = label;
           
               // SE-34391 : Changes to escape special characters.
               strToolTip = strToolTip.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
               strValue = strValue.replace(/&/g,"&amp;");
               activeStyle = activeStyle.replace(/&/g,"&amp;");
             imageClass = imageClass.replace(/&/g,"&amp;");
 
             // BUG-62486 GUJAS1 03/20/2012 Added index of the tab to the menu key.
             var snippet = '\n<Item Value="' + strValue + i + '" Caption="' + strValue + '" ToolTip="'
                     + strToolTip + '" ' + activeStyle + ' ImageClass="' + imageClass
                     + '" onClick="pega.ui.TabView.selectTab(' + i + ');"></Item>';
             dataXML += snippet;
         }
         if (!Event.isIE || pega.u.d.inStandardsMode)
             this._fixTabsDisplay("inline"); // BUG-73011 : Reset display value to inline
         dataXML += "\n</Menu>\n</pagedata>";
 
         var isLoaded = this.objMenuXML.loadXML(dataXML);
         var xmlMenuNode = this.objMenuXML.documentElement.selectSingleNode("//Menu");
 
         this.currentlyOpenedMenus.setStylePrefix("");
 
         this.currentlyOpenedMenus.desktopClickHandler.srcElement = this._menuButtonList;
         this.onBeforeShowMenu.fire();
         this.currentlyOpenedMenus.doContextMenu(xmlMenuNode, {relativeElement: this._menuButtonList, align: "right"});
         Event.stopEvent(e);
         return false;
     };
 
     proto._onDOMScroll = function(evt) {
         var target = evt.target ? evt.target : evt.srcElement;
         if (this._isHorizontal) {
             var scrollLeft = target.scrollLeft;
             var maxScroll = (this._lastItemOffset - this._tabContainerWidth);
             if (scrollLeft > maxScroll) {
                 target.scrollLeft = scrollLeft = maxScroll;
             }
             this._left = scrollLeft;
         }
         this._toggleQuickMenu();
     };
 
     proto.focusActiveTab = function(evt) {
         var newEl = this._tabParent.childNodes[this.get("activeIndex")];
         this.scrollToElement(newEl);
     };
 
     proto._setLastOffset = function() {
         //intentional global
         //try {
         if (typeof gCloseAllTabsInProgress != "undefined" && gCloseAllTabsInProgress) {
             return;
         }
         //} catch (e) {
         //currently gCloseAllTabsInProgress is not initialized and throws exception unless coming from closeAllDocuments
         //}
 
         if (this._scrollContainer && this._isHorizontal) {
             var childEl = this._tabParent.lastChild;
             if (childEl && this._tabPos == "Top") {
                 childEl = childEl.previousSibling;
             }
             while (childEl) {
                 if (childEl.style.display == "none") {
                     childEl = childEl.previousSibling;
                 } else {
                     break;
                 }
             }
 
             //The calls to fixTabsDisplay is no longer required as the default styling is inline-block and no toggling is required
             if (childEl && !(Dom.hasClass(childEl, "rightborder"))) {
                 // BUG-77009 07/25/2012 GUJAS1 Set the display of all tabs to inline-block to correctly calculate width.
                 //if(!Event.isIE || pega.u.d.inStandardsMode) this._fixTabsDisplay("inline-block");
 
                 this._lastItemOffset = (childEl.offsetLeft + childEl.offsetWidth);
 
                 // BUG-77009 07/25/2012 GUJAS1 Reset the display of all tabs to inline.
                 //if(!Event.isIE || pega.u.d.inStandardsMode) this._fixTabsDisplay("inline");//childEl.style.display = "inline";
             }
             this._toggleQuickMenu();
         }
     };
 
     proto._toggleQuickMenu = function() {
       if(!this._tabContainerWidth){
         //tabstrip is not ready yet. Possibly because this is the initial load of the tab group
         //We will not need to toggle the menu in this case
         return;
       }
       
       
         var tabStrip = this._tabParent.parentNode;
         if (tabStrip) {
             var aTabs = this.get("tabs"),
                     controlsWidth = (this._left == 0) ? this._currentMenuButtonWidth : 0,
                     tabsLength = (this._tabPos == "Top") ? aTabs.length - 1 : aTabs.length;
             if (this._tabContainerWidth == 0) {
                 return;
             }
             //For DC Tabs to always have Quick Menu
             if (this.isDCTabView && this._menuButton) {
                 if (this._menuButtonList.style.display != "inline-block") {
                     this._menuButtonList.style.display = "inline-block";
                 }
                 
                 // Fix for BUG-392611
                 // Hide the dc tabs overflow menu when gIsCustomTabHeaderEnabled is enabled
                 if(window.gIsCustomTabHeaderEnabled) {
                     this._menuButtonList.style.visibility = "hidden";
                 }
                 return;
             }
             this._reachedStart = (tabsLength == 0 || this._left <= 0);
             this._reachedEnd = (tabsLength == 0 || (this._tabContainerWidth + controlsWidth + this._left) >= this._lastItemOffset);
 
             if (this._reachedStart && this._reachedEnd) {
                 if (this._menuButton) {
                     this._menuButtonList.style.display = "none";
                     this._currentMenuButtonWidth = 0;
                 }
                 if (this.currentlyOpenedMenus) {
                     this.hideTabsMenu();
                 }
             }
             else {
                 if (this._menuButton) {
                     this._menuButtonList.style.display = "inline-block";
                     if (this._menuButtonListWidth == null) {
                         this._menuButtonListWidth = this._menuButton.offsetWidth;
                     }
                     this._currentMenuButtonWidth = this._menuButtonListWidth;
                 }
             }
         }
     };
 
     proto.scrollToElement = function(idOrEl) {
         var scrollEl;
         if (typeof (idOrEl) == "string") {
             scrollEl = document.getElementById(idOrEl);
         } else {
             scrollEl = idOrEl;
         }
         if (scrollEl && scrollEl.nodeType && !(Dom.hasClass(scrollEl, "rightborder"))) {
             var anchorElement = scrollEl.querySelector("span#TABANCHOR");
             if (this._isHorizontal && anchorElement) {
                 scrollEl = anchorElement;
                 var tabStrip = this._tabParent.parentNode,
                         scrollContainerWidth,
                         tabList,
                         itemLeft = scrollEl.offsetLeft,
                         itemWidth = scrollEl.offsetWidth,
                         scrollLeft = Math.abs(this._left),
                         leftOffset,
                         itemOffset = itemLeft + itemWidth;
                 if (this._tabContainerWidth == null) {
                     scrollContainerWidth = this._tabContainerWidth = tabStrip.offsetWidth;
                 } else {
                     scrollContainerWidth = this._tabContainerWidth;
                 }
                 leftOffset = scrollLeft + scrollContainerWidth;
                 if (itemLeft > scrollLeft && itemOffset < leftOffset) {
                     this._toggleQuickMenu();
                     return; // Already in visible area.
                 }
                 if (itemOffset >= leftOffset) {
                     itemLeft = scrollLeft + (itemOffset - leftOffset);
                 }
                 if (itemLeft < 0) {
                     itemLeft = 0;
                 }
                 this._left = itemLeft;
                 if(window.gIsCustomTabHeaderEnabled){
                    tabList = tabStrip.firstElementChild;
                    tabList.scrollLeft = this._left;
                 }else{
                    tabStrip.scrollLeft = this._left;   
                 }
             }
         }
         this._toggleQuickMenu();
     };
 
     proto._fixTabsDisplay = function(value) {
         /*BUG-121808: to remove the hardcoded 10000px width for tabs
          * this function needs to be turned off
          */
         return;
         //var length = this._tabParent.lastChild.className.indexOf("rightborder") != -1 ? this._tabParent.childNodes.length - 1 : this._tabParent.childNodes.length;
         //var length = this._tabPos == "Top" ? this._tabParent.childNodes.length - 1 : this._tabParent.childNodes.length;
         for (var i = 0; i < this._tabParent.childNodes.length; i++) {
             var node = this._tabParent.childNodes[i];
             if (node.className.indexOf("rightborder") == -1) {
                 node.style.display = value;
             }
         }
     }
 
     proto._resizeScrollContainer = function() {
         //HFix-20746
 //intentional global
         //try {
         if (typeof gCloseAllTabsInProgress != "undefined" && gCloseAllTabsInProgress) {
             return;
         }
         //} catch (e) {
 //currently gCloseAllTabsInProgress is not initialized and throws exception unless coming from closeAllDocuments
         //}
         var tabStrip = this._tabParent.parentNode;
         if (tabStrip && this._isHorizontal) {
             var scrollContainerWidth = tabStrip.offsetWidth,
                     scrollLeft = Math.abs(this._left),
                     itemLeft = 0,
                     lastItemOffset = this._lastItemOffset,
                     leftOffset = lastItemOffset - scrollLeft;
             if (scrollLeft > 0 && leftOffset <= scrollContainerWidth) {
                 itemLeft = scrollContainerWidth - leftOffset;
             }
             itemLeft = this._left + itemLeft;
             if (itemLeft >= 0) {
                 itemLeft = 0;
             }
             this._left = itemLeft;
             this._tabContainerWidth = scrollContainerWidth;
             tabStrip.scrollLeft = this._left;
             this.focusActiveTab();
         }
     };
 
     /* BUG-102407 GUJAS1 05/15/2013 Added new param to pass tab instance, */
     proto.getTabLabelIconAndTooltip = function(tabEl, oTab) {
         var labelElement = tabEl.querySelector("span[data-stl]"),
                 tabIconElement = tabEl.getElementsByTagName("img"),
                 anchorElement = tabEl.querySelector("span[id='TABANCHOR']"),
                 customTabHeaderEle = tabEl.querySelector("div[node_name='pyCustomDCTabSection']"),
                 label = "", icon = "", tooltip = "";
 
         /* BUG-102407 GUJAS1 05/15/2013 Read label/tooltip/icon from cached properties if available */
 
       if(window.gIsCustomTabHeaderEnabled && customTabHeaderEle){
         label = customTabHeaderEle.innerText;
         var toolTipEle = customTabHeaderEle.querySelector("[title]");
         if(toolTipEle){
           tooltip = toolTipEle.title;
         }
       } else if (oTab) {
             if (typeof oTab.label == "string" && oTab.label.length > 0) {
                 label = oTab.label;
             }
             if (typeof oTab.ToolTip == "string" && oTab.ToolTip.length > 0) {
                 tooltip = oTab.ToolTip;
             }
             if (typeof oTab.iconPath == "string" && oTab.iconPath.length > 0) {
                 icon = oTab.iconPath;
             }
         }
 
         if (label == "" && labelElement) {
             label = Dom.getInnerText(labelElement);
         }
         if (tooltip == "" && anchorElement) {
             tooltip = anchorElement.title;
         }
         if (icon == "" && tabIconElement.length > 0) {
             icon = tabIconElement[0].src;
             tooltip = tabIconElement[0].title;
         }
           if(icon && tooltip==""){
             tooltip = tabIconElement[0].title;
         }
         return {"label": label, "icon": icon, "tooltip": tooltip};
     };
     /**
      * The className to add when building from scratch.
      * @property CLASSNAME
      * @default "navset"
      */
     proto.CLASSNAME = 'yui-navset';
 
     /**
      * The className of the HTMLElement containing the TabView's tab elements
      * to look for when building from existing markup, or to add when building
      * from scratch.
      * All childNodes of the tab container are treated as Tabs when building
      * from existing markup.
      * @property TAB_PARENT_CLASSNAME
      * @default "nav"
      */
     proto.TAB_PARENT_CLASSNAME = 'yui-nav';
 
     /**
      * The className of the HTMLElement containing the TabView's label elements
      * to look for when building from existing markup, or to add when building
      * from scratch.
      * All childNodes of the content container are treated as content elements when
      * building from existing markup.
      * @property CONTENT_PARENT_CLASSNAME
      * @default "nav-content"
      */
     proto.CONTENT_PARENT_CLASSNAME = 'yui-content';
 
     proto._tabParent = null;
     proto._contentParent = null;
 
     /**
      * Adds a Tab to the TabView instance.
      * If no index is specified, the tab is added to the end of the tab list.
      * @method addTab
      * @param {pega.ui.Tab} tab A Tab instance to add.
      * @param {Integer} index The position to add the tab.
      * @return void
      */
     proto.addTab = function(tab, index) {
         var tabs = this.get('tabs');
         if (!tabs) { // not ready yet
             this._queue[this._queue.length] = ['addTab', arguments];
             return false;
         }
 
         index = (index === undefined) ? tabs.length : index;
         tab.tabview = this;
         var before = this.getTab(index);
 
         var self = this;
         var el = this.get('element');
         var tabParent = this._tabParent;
         var contentParent = this._contentParent;
 
         var tabElement = tab.get('element');
         var contentEl = tab.get('contentEl');
         //BUG-156444 : hide tabs list container when there are no tabs
         var contentElements = _getChildNodes(this._contentParent);
         if (this._scrollContainer && contentElements.length > 0) {
             this._scrollContainer.style.display = "";
         }
         if (before) {
             tabParent.insertBefore(tabElement, before.get('element'));
         } else {
             tabParent.appendChild(tabElement);
         }
 
         if (contentEl && !Dom.isAncestor(contentParent, contentEl)) {
             contentParent.appendChild(contentEl);
         }
 
         if (!tab.get('active')) {
             tab.set('contentVisible', false, true); /* hide if not active */
         } else {
             this.set('activeTab', tab, true);
 
         }
 
         var activate = function(e, tabObj) {
           // BUG-44883 Checkbox doesn’t work in Tab and Accordian header modes becuase of preventing the default behavior of the event. To fix this bug added below tagName condition.
           var target = pega.util.Event.getTarget(e);
           if (!target || !target.tagName || !target.tagName.match(/^(input|select|textarea)$/gi)) {
             pega.util.Event.preventDefault(e);
           }
           
           var existingActiveTab = self.get('activeTab');
           self.set('activeTab', tabObj);
           
           if(tabObj.tabview.isDCTabView){
             pega.desktop.sendEvent('DCTabSwitch', {
               fromTab: {
                 id: existingActiveTab.label,
                 handle: existingActiveTab.key,
                 GadgetName: existingActiveTab.GadgetName  
               },
               toTab: {
                 id: tabObj.label,
                 handle: tabObj.key,
                 GadgetName: tabObj.GadgetName
               }
             }); 
           }
         };
         if (this.hasClass("with-fixed-header")) {
             Event.addListener(tabElement, tab.get('activationEvent'), activate, tab);
         } else {
             tab.addListener(tab.get('activationEvent'), activate, tab);
         }
 
         tab.addListener('activationEventChange', function(e) {
             if (e.prevValue != e.newValue) {
                 if (this.tabview.hasClass("with-fixed-header")) {
                     Event.removeListener(tab.get('element'), e.prevValue, activate, tab);
                     Event.addListener(tab.get('element'), e.newValue, activate, tab);
                 } else {
                     tab.removeListener(e.prevValue, activate, tab);
                     tab.addListener(e.newValue, activate, tab);
                 }
             }
         });
 
         tabs.splice(index, 0, tab);
         //this._setLastOffset(); //not required - has perf penalty
         this.fireEvent("tabAdded", {"tabs": this.get("tabs"), "addedTab": tab});
     };
 
     /**
      * Routes childNode events.
      * @method DOMEventHandler
      * @param {event} e The Dom event that is being handled.
      * @return void
      */
     proto.DOMEventHandler = function(e) {
         var el = this.get('element');
         var target = pega.util.Event.getTarget(e);
         var tabParent = this._tabParent;
 
         var inAccordion = false;
         if (el && el.id && el.id.indexOf("PEGA_ACCORDION") == 0) {
             inAccordion = true;
         }
         if (Dom.isAncestor(tabParent, target)) {
             var tabEl;
             var tab = null;
             var contentEl;
             var tabs = this.get('tabs');
             for (var i = 0, len = tabs.length; i < len; i++) {
                 tabEl = tabs[i].get('element');
                 contentEl = tabs[i].get('contentEl');
                 if (inAccordion) {
                     var firstChild = pega.util.Dom.getChildren(tabEl)[0];
                     if (target == tabEl || target == firstChild || Dom.isAncestor(firstChild, target)) {
                         tab = tabs[i];
                         break; // note break
                     }
                 } else {
                     if ((target == tabEl || Dom.isAncestor(tabEl, target)) && (tabEl.className == null || tabEl.className.indexOf('addTab') < 0)) {
                         tab = tabs[i];
                         break; // note break
                     }
                 }
             }
             if (tab) {
                 tab.fireEvent(e.type, e);
             }
         }
     };
     /**
      * Returns the Tab instance at the specified index.
      * @method getTab
      * @param {Integer} index The position of the Tab.
      * @return pega.ui.Tab
      */
     proto.getTab = function(index) {
         return this.get('tabs')[index];
     };
 
     /**
      * Returns the index of given tab.
      * @method getTabIndex
      * @param {pega.ui.Tab} tab The tab whose index will be returned.
      * @return int
      */
     proto.getTabIndex = function(tab) {
         var index = null;
         var tabs = this.get('tabs');
         for (var i = 0, len = tabs.length; i < len; ++i) {
             if (tab == tabs[i]) {
                 index = i;
                 break;
             }
         }
 
         return index;
     };
 
     /**
      * Removes the specified Tab from the TabView.
      * @method removeTab
      * @param {pega.ui.Tab} item The Tab instance to be removed.
      * @param {boolean} pass true if MRU like mechanism is present to change active indexes. Desired by Workarea layouts.
      * @return void
      */
     proto.removeTab = function(tab, keepActiveIndex) {
         var tabCount = this.get('tabs').length;
 
         var index = this.getTabIndex(tab);
         var nextIndex = index + 1;
         if (!keepActiveIndex && tab == this.get('activeTab')) { // select next tab
             if (tabCount > 1) {
                 if (index + 1 == tabCount) {
                     this.set('activeIndex', index - 1);
                 } else {
                     this.set('activeIndex', index + 1);
                 }
             }
         }
 
         this._tabParent.removeChild(tab.get('element'));
         this._contentParent.removeChild(tab.get('contentEl'));
         this._configs.tabs.value.splice(index, 1);
 
         //this._setLastOffset();
         //this._resizeScrollContainer();
         this.resizeTabsScroll(); //this does both the above calls and properly handles the tabs menu toggle
 
         this.fireEvent("tabRemoved", {"tabs": this.get("tabs"), "removedTab": tab});
     };
 
     /**
      * Provides a readable name for the TabView instance.
      * @method toString
      * @return String
      */
     proto.toString = function() {
         var name = this.get('id') || this.get('tagName');
         return "TabView " + name;
     };
 
     /**
      * The transiton to use when switching between tabs.
      * @method contentTransition
      */
     proto.contentTransition = function(newTab, oldTab) {
         newTab.set('contentVisible', true);
         oldTab.set('contentVisible', false);
     };
 
     /**
      * setAttributeConfigs TabView specific properties.
      * @method initAttributes
      * @param {Object} attr Hash of initial attributes
      */
     proto.initAttributes = function(attr) {
         pega.ui.TabView.superclass.initAttributes.call(this, attr);
 
         if (!attr.orientation) {
             attr.orientation = 'top';
         }
 
         var el = this.get('element');
 
         /**
          * The Tabs belonging to the TabView instance.
          * @config tabs
          * @type Array
          */
         this.setAttributeConfig('tabs', {
             value: [],
             readOnly: true
         });
 
         /**
          * The container of the tabView's label elements.
          * @property _tabParent
          * @private
          * @type HTMLElement
          */
         var tabParentCandidate = Dom.getFirstChild(el);
         this._isCSSResize = false;
         var scrollContainerEl;
         /* BUG-139599 - If Accordion has a TabGroup, then the accordion is detecting as it contains scroll container. Because of it the _tabParent was set incorrectly.: KUMAD1 */
         if (el.id.indexOf("PEGA_ACCORDION") != 0) {
             scrollContainerEl = Dom.getChildrenBy(el, function(obj) {
                 return (obj.className && obj.className.indexOf("scrlCntr") != -1);
             })[0];
         }
         if (this.hasClass("with-fixed-header")) {
             this._isCSSResize = true;
             scrollContainerEl = Dom.getFirstChild(document.getElementById("dummyDiv"));
         }
         if (scrollContainerEl) {
             this._scrollContainer = scrollContainerEl;
             var tabPos = el.getAttribute('data-pos');
             this._isHorizontal = (tabPos == "Top" || tabPos == "Bottom");
             this._tabPos = tabPos;
 
             if (tabPos == "Top") { //Horizontal top tabs case
                 if (this._isCSSResize) {
                     tabParentCandidate = Dom.getFirstChild(document.getElementById("dummyDiv"));
                 }
                 this._tabParent = tabParentCandidate.lastChild.firstChild;
             } else if (tabPos == "Left" || tabPos == "Right") { //Vertical tabs case
                 var tblElement = tabParentCandidate;
                 if (this._isCSSResize) {
                     tabParentCandidate = $(".dc-" + tabPos.toLowerCase() + " .contents .pegaTabGrp .tab-ul")[0];
                 }
                 else {
                     tabParentCandidate = Dom.getFirstChild(tblElement.rows[0].cells[0]);
                 }
                 if (tabParentCandidate && tabPos == "Left") { // Vertical tabs on the left case
                     //BUG-69633 05/10/2012 GUJAS1 Markup changes have caused the UL to be the first cell element.
                     //this._tabParent = tabParentCandidate.lastChild;
                     this._tabParent = tabParentCandidate;
                 } else {
                     if (this._isCSSResize) {
                         tabParentCandidate = $(".dc-" + tabPos.toLowerCase() + " .contents .pegaTabGrp .tab-ul")[0];
                     }
                     else {
                         tabParentCandidate = Dom.getFirstChild(tblElement.rows[0].cells[1]);
                     }
                     if (tabParentCandidate && tabPos == "Right") { // Vertical tabs on the right case
                         //BUG-69633 05/10/2012 GUJAS1 Markup changes have caused the UL to be the first cell element.
                         //this._tabParent = tabParentCandidate.lastChild;
                         this._tabParent = tabParentCandidate;
                     }
                 }
             } else if (tabPos == "Bottom") {
                 if (this._isCSSResize) {
                     tabParentCandidate = Dom.getFirstChild(document.getElementById("dummyDiv"));
                 } else {
                     tabParentCandidate = Dom.getLastChild(el);
                 }
                 this._tabParent = tabParentCandidate.lastChild.firstChild;
             } else {
                 this._tabParent = _createTabParent.call(this);
             }
             // BUG-70791 START
             var harnessHeaderIcons = Dom.getElementsByClassName("harnessHeaderIcons", "div", tabParentCandidate);
             if (harnessHeaderIcons.length > 0) {
                 this._harnessHeaderIcons = harnessHeaderIcons[0];
             }
             // BUG-70791 END
             var tabButtonsList = tabParentCandidate.getElementsByTagName("ol");
             // If tabButtonsList has children, initialize scroller elements.
             if (tabButtonsList.length > 0) {
                 /*
                  this._prevButtonList = tabButtonsList[0];
                  this._prevButton = this._prevButtonList.getElementsByTagName("a")[0];
                  this._nextButtonList = (tabButtonsList.length == 3) ? tabButtonsList[2] : tabButtonsList[1];
                  this._nextButton = this._nextButtonList.getElementsByTagName("a")[0];
                  */
                 this._menuButtonList = tabButtonsList[0];
                 this._menuButton = this._menuButtonList ? this._menuButtonList.getElementsByTagName("a")[0] : null;
             }
         } else {
             if (tabParentCandidate.nodeName === 'UL') { //Horizontal top tabs case
                 this._tabParent = tabParentCandidate;
             } else if (tabParentCandidate.nodeName === 'TABLE') { //Vertical tabs case
                 var tblElement = tabParentCandidate;
                 tabParentCandidate = Dom.getFirstChild(tblElement.rows[0].cells[0]);
                 if (tabParentCandidate && tabParentCandidate.nodeName === 'UL') { // Vertical tabs on the left case
                     this._tabParent = tabParentCandidate;
                 } else {
                     tabParentCandidate = Dom.getFirstChild(tblElement.rows[0].cells[1]);
                     if (tabParentCandidate && tabParentCandidate.nodeName === 'UL') { // Vertical tabs on the right case
                         this._tabParent = tabParentCandidate;
                     }
                 }
             } else if (tabParentCandidate.nodeName === 'DIV') {
                 this._tabParent = Dom.getLastChild(el);
             } else {
                 this._tabParent = _createTabParent.call(this);
             }
         }
 
         /**
          * The container of the tabView's content elements.
          * @property _contentParent
          * @type HTMLElement
          * @private
          */
         this._contentParent =
                 this.getElementsByClassName(this.CONTENT_PARENT_CLASSNAME,
                         'div')[0] || _createContentParent.call(this);
 
         /**
          * How the Tabs should be oriented relative to the TabView.
          * @config orientation
          * @type String
          * @default "top"
          */
         this.setAttributeConfig('orientation', {
             value: attr.orientation,
             method: function(value) {
                 var current = this.get('orientation');
                 //this.addClass('yui-navset-' + value);
 
                 if (current != value) {
                     this.removeClass('yui-navset-' + current);
                 }
 
                 switch (value) {
                     case 'bottom':
                         this.appendChild(this._tabParent);
                         break;
                 }
             }
         });
 
         /**
          * The index of the tab currently active.
          * @config activeIndex
          * @type Int
          */
         this.setAttributeConfig('activeIndex', {
             value: attr.activeIndex,
             method: function(value) {
                 this.set('activeTab', this.getTab(value));
             },
             validator: function(value) {
                 return !this.getTab(value).get('disabled'); // cannot activate if disabled
             }
         });
 
         /**
          * The tab currently active.
          * @config activeTab
          * @type pega.ui.Tab
          */
         this.setAttributeConfig('activeTab', {
             value: attr.activeTab,
             method: function(tab) {
                 var activeTab = this.get('activeTab');
 
                 if (tab) {
                     tab.set('active', true);
                     this._configs['activeIndex'].value = this.getTabIndex(tab); // keep in sync
                 }
 
                 if (activeTab && activeTab != tab) {
                     activeTab.set('active', false);
                 }
 
                 if (activeTab && tab != activeTab) { // no transition if only 1
                     this.contentTransition(tab, activeTab);
                 } else if (tab) {
                     tab.set('contentVisible', true);
                 }
             },
             validator: function(value) {
                 return !value.get('disabled'); // cannot activate if disabled
             }
         });
 
         if (this._tabParent) {
             _initTabs.call(this);
         }
 
         for (var type in this.DOM_EVENTS) {
             if (pega.lang.hasOwnProperty(this.DOM_EVENTS, type)) {
                 this.addListener.call(this, type, this.DOMEventHandler);
             }
         }
     };
 
     /**
      * Creates Tab instances from a collection of HTMLElements.
      * @method createTabs
      * @private
      * @param {Array|HTMLCollection} elements The elements to use for Tabs.
      * @return void
      */
     var _initTabs = function() {
         var tab,
                 attr,
                 contentEl;
 
         var el = this.get('element');
         var tabs = _getChildNodes(this._tabParent);
         var contentElements = _getChildNodes(this._contentParent);
         if (this._scrollContainer && contentElements.length == 0) {
             this._scrollContainer.style.display = "none";
         }
         for (var i = 0, len = tabs.length; i < len; ++i) {
             attr = {};
 
             if (contentElements[i]) {
                 attr.contentEl = contentElements[i];
             }
 
             tab = new pega.ui.Tab(tabs[i], attr);
             this.addTab(tab);
 
             if (tab.hasClass(tab.ACTIVE_CLASSNAME)) {
                 this._configs.activeTab.value = tab; // dont invoke method
             }
         }
     };
 
     var _createTabViewElement = function(attr) {
         var el = document.createElement('div');
 
         if (this.CLASSNAME) {
             el.className = this.CLASSNAME;
         }
 
         return el;
     };
 
     var _createTabParent = function(attr) {
         var el = document.createElement('ul');
 
         if (this.TAB_PARENT_CLASSNAME) {
             el.className = this.TAB_PARENT_CLASSNAME;
         }
 
         this.get('element').appendChild(el);
 
         return el;
     };
 
     var _createContentParent = function(attr) {
         var el = document.createElement('div');
 
         if (this.CONTENT_PARENT_CLASSNAME) {
             el.className = this.CONTENT_PARENT_CLASSNAME;
         }
 
         this.get('element').appendChild(el);
 
         return el;
     };
 
     var _getChildNodes = function(el) {
         var nodes = [];
         var childNodes = el.childNodes;
 
         for (var i = 0, len = childNodes.length; i < len; ++i) {
             if (childNodes[i].nodeType == 1) {
                 nodes[nodes.length] = childNodes[i];
             }
         }
 
         return nodes;
     };
 })();
 
 (function() {
     var Dom = pega.util.Dom,
             Event = pega.util.Event;
 
     /**
      * A representation of a Tab's label and content.
      * @namespace pega.widget
      * @class Tab
      * @extends pega.util.Element
      * @constructor
      * @param element {HTMLElement | String} (optional) The html element that
      * represents the TabView. An element will be created if none provided.
      * @param {Object} properties A key map of initial properties
      */
     var Tab = function(el, attr) {
         attr = attr || {};
         if (arguments.length == 1 && !pega.lang.isString(el) && !el.nodeName) {
             attr = el;
             el = attr.element;
         }
 
         if (!el && !attr.element) {
             el = _createTabElement.call(this, attr);
         }
 
         this.loadHandler = {
             success: function(o) {
                 this.set('content', o.responseText);
             },
             failure: function(o) {
                 pega.log('loading failed: ' + o.statusText,
                         'error', 'Tab');
             }
         };
 
         Tab.superclass.constructor.call(this, el, attr);
 
         this.DOM_EVENTS = {}; // delegating to tabView
     };
 
     pega.extend(Tab, pega.util.Element);
     var proto = Tab.prototype;
 
     /**
      * The default tag name for a Tab's inner element.
      * @property LABEL_INNER_TAGNAME
      * @type String
      * @default "em"
      */
     proto.LABEL_TAGNAME = 'em';
 
     /**
      * The class name applied to active tabs.
      * @property ACTIVE_CLASSNAME
      * @type String
      * @default "on"
      */
     proto.ACTIVE_CLASSNAME = 'selected';
 
     /**
      * The class name applied to disabled tabs.
      * @property DISABLED_CLASSNAME
      * @type String
      * @default "disabled"
      */
     proto.DISABLED_CLASSNAME = 'disabled';
 
     /**
      * The class name applied to dynamic tabs while loading.
      * @property LOADING_CLASSNAME
      * @type String
      * @default "disabled"
      */
     proto.LOADING_CLASSNAME = 'loading';
 
     /**
      * Provides a reference to the connection request object when data is
      * loaded dynamically.
      * @property dataConnection
      * @type Object
      */
     proto.dataConnection = null;
 
     /**
      * Object containing success and failure callbacks for loading data.
      * @property loadHandler
      * @type object
      */
     proto.loadHandler = null;
 
     /**
      * Provides a readable name for the tab.
      * @method toString
      * @return String
      */
     proto.toString = function() {
         var el = this.get('element');
         var id = el.id || el.tagName;
         return "Tab " + id;
     };
 
     /**
      * setAttributeConfigs TabView specific properties.
      * @method initAttributes
      * @param {Object} attr Hash of initial attributes
      */
     proto.initAttributes = function(attr) {
         attr = attr || {};
         Tab.superclass.initAttributes.call(this, attr);
 
         var el = this.get('element');
 
         /**
          * The event that triggers the tab's activation.
          * @config activationEvent
          * @type String
          */
         this.setAttributeConfig('activationEvent', {
             value: attr.activationEvent || 'click'
         });
 
         /**
          * The element that contains the tab's label.
          * @config labelEl
          * @type HTMLElement
          */
         this.setAttributeConfig('labelEl', {
             value: attr.labelEl || _getlabelEl.call(this),
             method: function(value) {
                 var current = this.get('labelEl');
 
                 if (current) {
                     if (current == value) {
                         return false; // already set
                     }
 
                     this.replaceChild(value, current);
                 } else if (el.firstChild) { // ensure label is firstChild by default
                     this.insertBefore(value, el.firstChild);
                 } else {
                     this.appendChild(value);
                 }
             }
         });
 
         /**
          * The tab's label text (or innerHTML).
          * @config label
          * @type String
          */
         this.setAttributeConfig('label', {
             value: attr.label || _getLabel.call(this),
             method: function(value) {
                 var labelEl = this.get('labelEl');
                 if (!labelEl) { // create if needed
                     this.set('labelEl', _createlabelEl.call(this));
                 }
 
                 _setLabel.call(this, value);
             }
         });
 
         /**
          * The HTMLElement that contains the tab's content.
          * @config contentEl
          * @type HTMLElement
          */
         this.setAttributeConfig('contentEl', {
             value: attr.contentEl || document.createElement('div'),
             method: function(value) {
                 var current = this.get('contentEl');
 
                 if (current) {
                     if (current == value) {
                         return false; // already set
                     }
                     this.replaceChild(value, current);
                 }
             }
         });
 
         /**
          * The tab's content.
          * @config content
          * @type String
          */
         this.setAttributeConfig('content', {
             value: attr.content,
             method: function(value) {
                 this.get('contentEl').innerHTML = value;
             }
         });
 
         var _dataLoaded = false;
 
         /**
          * The tab's data source, used for loading content dynamically.
          * @config dataSrc
          * @type String
          */
         this.setAttributeConfig('dataSrc', {
             value: attr.dataSrc
         });
 
         /**
          * Whether or not content should be reloaded for every view.
          * @config cacheData
          * @type Boolean
          * @default false
          */
         this.setAttributeConfig('cacheData', {
             value: attr.cacheData || false,
             validator: pega.lang.isBoolean
         });
 
         /**
          * The method to use for the data request.
          * @config loadMethod
          * @type String
          * @default "GET"
          */
         this.setAttributeConfig('loadMethod', {
             value: attr.loadMethod || 'GET',
             validator: pega.lang.isString
         });
 
         /**
          * Whether or not any data has been loaded from the server.
          * @config dataLoaded
          * @type Boolean
          */
         this.setAttributeConfig('dataLoaded', {
             value: false,
             validator: pega.lang.isBoolean,
             writeOnce: true
         });
 
         /**
          * Number if milliseconds before aborting and calling failure handler.
          * @config dataTimeout
          * @type Number
          * @default null
          */
         this.setAttributeConfig('dataTimeout', {
             value: attr.dataTimeout || null,
             validator: pega.lang.isNumber
         });
 
         /**
          * Whether or not the tab is currently active.
          * If a dataSrc is set for the tab, the content will be loaded from
          * the given source.
          * @config active
          * @type Boolean
          */
         this.setAttributeConfig('active', {
             value: attr.active || this.hasClass(this.ACTIVE_CLASSNAME),
             method: function(value) {
                 if (value === true) {
                     this.addClass(this.ACTIVE_CLASSNAME);
                     Dom.addClass(this.get('element'), this.get('element').getAttribute("sel_prefix") + "-" + "selected");
                     // BUG-54795 12/13/2011 GUJAS1 Removed the title update on focus/blur of tab
                     // this.set('title', 'active');
                 } else {
                     this.removeClass(this.ACTIVE_CLASSNAME);
                     Dom.removeClass(this.get('element'), this.get('element').getAttribute("sel_prefix") + "-" + "selected");
                     // BUG-54795 12/13/2011 GUJAS1 Removed the title update on focus/blur of tab
                     //this.set('title', '');
                 }
             },
             validator: function(value) {
                 return pega.lang.isBoolean(value) && !this.get('disabled');
             }
         });
 
         /**
          * Whether or not the tab is disabled.
          * @config disabled
          * @type Boolean
          */
         this.setAttributeConfig('disabled', {
             value: attr.disabled || this.hasClass(this.DISABLED_CLASSNAME),
             method: function(value) {
                 if (value === true) {
                     Dom.addClass(this.get('element'), this.DISABLED_CLASSNAME);
                 } else {
                     Dom.removeClass(this.get('element'), this.DISABLED_CLASSNAME);
                 }
             },
             validator: pega.lang.isBoolean
         });
 
         /**
          * The href of the tab's anchor element.
          * @config href
          * @type String
          * @default '#'
          */
         this.setAttributeConfig('href', {
             value: attr.href || '#',
             method: function(value) {
                 this.getElementsByTagName('a')[0].href = value;
             },
             validator: pega.lang.isString
         });
 
         /**
          * The Whether or not the tab's content is visible.
          * @config contentVisible
          * @type Boolean
          * @default false
          */
         this.setAttributeConfig('contentVisible', {
             value: attr.contentVisible,
             method: function(value) {
                 var contentEl = this.get('contentEl');
                 if (value) {
                     if (contentEl.style.display != "" && contentEl.style.display != "block")
                         contentEl.style.display = 'block';
                     if (this.get('dataSrc')) {
                         // load dynamic content unless already loaded and caching
                         if (!this.get('dataLoaded') || !this.get('cacheData')) {
                             _dataConnect.call(this);
                         }
                     }
                 } else if (contentEl.style.display != "none") {
                     contentEl.style.display = 'none';
                       /*SE-37672 : calling scrollIntoViewIfOutOfView for active accordion to be in view*/
                     var parentUl = this.get('element').parentNode;
                       var liEl = parentUl && parentUl.getElementsByClassName('selected') && parentUl.getElementsByClassName('selected').length > 0 && parentUl.getElementsByClassName('selected')[0];
                       var anchorEl = liEl && pega.util.Dom.getElementsById('ACCORANCHOR', liEl) && pega.util.Dom.getElementsById('ACCORANCHOR', liEl).length > 0 && pega.util.Dom.getElementsById('ACCORANCHOR', liEl)[0];
                       anchorEl && pega.u.d.scrollIntoViewIfOutOfView(anchorEl);
                   
                 }
             },
             validator: pega.lang.isBoolean
         });
     };
 
     var _createTabElement = function(attr) {
         //If user is already specifying syntactically proper LI to be added, just set this li as the labelEl.
         if (attr && attr.labelEl && attr.labelEl.tagName == 'LI') {
             return attr.labelEl;
         }
         var el = document.createElement('li');
         var a = document.createElement('a');
 
         a.href = attr.href || '#';
 
         el.appendChild(a);
 
         var label = attr.label || null;
         var labelEl = attr.labelEl || null;
 
         if (labelEl) { // user supplied labelEl
             if (!label) { // user supplied label
                 label = _getLabel.call(this, labelEl);
             }
         } else {
             labelEl = _createlabelEl.call(this);
         }
 
         a.appendChild(labelEl);
 
         return el;
     };
 
     var _getlabelEl = function() {
         return this.getElementsByTagName(this.LABEL_TAGNAME)[0];
     };
 
     var _createlabelEl = function() {
         var el = document.createElement(this.LABEL_TAGNAME);
         return el;
     };
 
     var _setLabel = function(label) {
         var el = this.get('labelEl');
         el.innerHTML = label;
     };
 
     var _getLabel = function() {
         var label,
                 el = this.get('labelEl');
 
         if (!el) {
             return undefined;
         }
 
         return el.innerHTML;
     };
 
     var _dataConnect = function() {
         if (!pega.util.Connect) {
             pega.log('pega.util.Connect dependency not met',
                     'error', 'Tab');
             return false;
         }
 
         Dom.addClass(this.get('contentEl').parentNode, this.LOADING_CLASSNAME);
 
         this.dataConnection = pega.util.Connect.asyncRequest(
                 this.get('loadMethod'),
                 this.get('dataSrc'),
                 {
                     success: function(o) {
                         this.loadHandler.success.call(this, o);
                         this.set('dataLoaded', true);
                         this.dataConnection = null;
                         Dom.removeClass(this.get('contentEl').parentNode,
                                 this.LOADING_CLASSNAME);
                     },
                     failure: function(o) {
                         this.loadHandler.failure.call(this, o);
                         this.dataConnection = null;
                         Dom.removeClass(this.get('contentEl').parentNode,
                                 this.LOADING_CLASSNAME);
                     },
                     scope: this,
                     timeout: this.get('dataTimeout')
                 }
         );
     };
     pega.ui.Tab = Tab;
 })();
 //static-content-hash-trigger-GCC