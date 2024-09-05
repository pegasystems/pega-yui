pega.namespace("pega.desktop");

// BEGIN RESIZEPANEL SUBCLASS //
pega.widget.ResizePanel = function(el, userConfig) {
	if (arguments.length > 0) {
		pega.widget.ResizePanel.superclass.constructor.call(this, el, userConfig);
	}
}

pega.extend(pega.widget.ResizePanel, pega.widget.Panel);

pega.widget.ResizePanel.CSS_PANEL_RESIZE = "resizepanel";
pega.widget.ResizePanel.CSS_RESIZE_HANDLE = "resizehandle";

pega.widget.ResizePanel.prototype.init = function(el, userConfig) {
	
	pega.widget.ResizePanel.superclass.init.call(this, el);
	this.createEvent("resizeEvent");
	this.beforeInitEvent.fire(pega.widget.ResizePanel);
	pega.util.Dom.addClass(this.innerElement, pega.widget.ResizePanel.CSS_PANEL_RESIZE);

	this.resizeHandle = document.createElement("div");
	this.resizeHandle.id = this.id + "_r";
	this.resizeHandle.className = pega.widget.ResizePanel.CSS_RESIZE_HANDLE;
	this.beforeRenderEvent.subscribe(function() {
		if (! this.footer) {
			this.setFooter("");
		}
	},
	this, true
	);

	this.renderEvent.subscribe(function() {
		var me = this;
		/*Attach drag drop to modal dialog header*/
		this.ddDragdrop = new pega.util.DD('modaldialog_c');		
		this.ddDragdrop.addInvalidHandleType("INPUT");
		this.ddDragdrop.addInvalidHandleType("TEXTAREA");
		this.ddDragdrop.addInvalidHandleType("SELECT");
		this.ddDragdrop.addInvalidHandleType("LABEL");
		this.ddDragdrop.addInvalidHandleType("BUTTON");
		this.ddDragdrop.addInvalidHandleType("IMG");

		this.ddDragdrop.startDrag = function() {
			var offsetHeight,
			offsetWidth,
			viewPortWidth,
			viewPortHeight,
			scrollX,
			scrollY;
			if (me.cfg.getProperty("constraintoviewport")) {
								
				var nViewportOffset = pega.widget.Overlay.VIEWPORT_OFFSET;
				offsetHeight = me.element.offsetHeight;
				offsetWidth = me.element.offsetWidth;

				viewPortWidth = pega.util.Dom.getViewportWidth();
				viewPortHeight = pega.util.Dom.getViewportHeight();
								
				scrollX = pega.util.Dom.getDocumentScrollLeft();
				scrollY = pega.util.Dom.getDocumentScrollTop();
			
				if (offsetHeight + nViewportOffset < viewPortHeight) {
					this.minY = scrollY + nViewportOffset;
					this.maxY = scrollY + viewPortHeight - offsetHeight - nViewportOffset;
				} else {
					this.minY = scrollY + nViewportOffset;
					this.maxY = scrollY + nViewportOffset;
				}
								
				if (offsetWidth + nViewportOffset < viewPortWidth) {
					this.minX = scrollX + nViewportOffset;
					this.maxX = scrollX + viewPortWidth - offsetWidth - nViewportOffset;
				} else {
					this.minX = scrollX + nViewportOffset;
					this.maxX = scrollX + nViewportOffset;
				}

				this.constrainX = true;
				this.constrainY = true;
			} else {
				this.constrainX = false;
				this.constrainY = false;
			}
							
 		me.dragEvent.fire("startDrag", arguments);

		};
						
		this.ddDragdrop.endDrag = function(){
			me.syncPosition();
			me.cfg.refireEvent("iframe");
			if (this.platform == "mac" && pega.env.ua.gecko) {
				this.showMacGeckoScrollbars();
			}
			me.dragEvent.fire("onDrag", arguments);
		};		

		me.innerElement.appendChild(me.resizeHandle);
		this.ddResize = new pega.util.DragDrop(this.resizeHandle.id,this.id);
		this.ddResize.setHandleElId(this.resizeHandle.id);
		this.ddResize.onMouseDown = function(e) {
			this.startWidth = me.innerElement.offsetWidth;
			this.startHeight = me.innerElement.offsetHeight;

			me.cfg.setProperty("width", this.startWidth + "px");
			me.cfg.setProperty("height", this.startHeight + "px");
			this.startPos = [pega.util.Event.getPageX(e),
			pega.util.Event.getPageY(e)];

			me.innerElement.style.overflow = "hidden";
			var modalDialogBody = document.getElementById("modaldialog_bd");
			if(!pega.util.Event.isIE){
				modalDialogBody.style.height = "auto";
			}
			var modalDialogContent = $("#modaldialog_con", document.getElementById("modaldialog")).get(0);
			if(modalDialogContent) {
				while(modalDialogContent.parentNode.nodeName != "DIV"){
					modalDialogContent = modalDialogContent.parentNode;
				}
				modalDialogContent = modalDialogContent.parentNode;
			}else {
				modalDialogContent = modalDialogBody;
			}
			me.body = modalDialogContent;
			me.body.style.overflow = "auto";
		}
		
		this.ddResize.endDrag = function(e) {
			var adjustment = 2;
			/*var adjustHeight = 20;
			if(pega.util.Event.isIE) {
				adjustHeight = 50;
			}*/

			//BUG-58180 12/29/2011 KODUC removing the extra space for the modal dialog		
			var adjustHeight = document.getElementById("modaldialog_ft").offsetHeight;
			//End of the BUG-58180

			var dimensionObj = {height: "0px", width: "0px"};
			var newPos = [pega.util.Event.getPageX(e), pega.util.Event.getPageY(e)];
			var offsetX = newPos[0] - this.startPos[0];
			var offsetY = newPos[1] - this.startPos[1];

			//BUG-55153 1-12-2011 KODUC setting content height and width based on the modal dialog height and width
			//var newWidth = Math.max(this.startWidth + offsetX, 10);
			//var newHeight = Math.max(this.startHeight + offsetY, 10);
			//dimensionObj.height = newHeight;
			//dimensionObj.width = newWidth;
			
			var newWidth = this.actualWidth;
			var newHeight = this.actualHeight;
			dimensionObj.height = this.actualHeight;
			dimensionObj.width = this.actualWidth;
			//End of BUG-55153
			
			var modalDialogBody = document.getElementById("modaldialog_bd");
			var modalDialogContent = $("#modaldialog_con", document.getElementById("modaldialog")).get(0);
			if(modalDialogContent) {
				while(modalDialogContent.parentNode.nodeName != "DIV"){
					modalDialogContent = modalDialogContent.parentNode;
				}
				modalDialogContent = modalDialogContent.parentNode;
			}
			else {
				modalDialogContent = modalDialogBody;
			}
			var actionIframe = window.parent.frames.actionIFrame;
			var actionIframeSec = false;
			if(typeof(actionIframe)!="undefined"){			
				pega.u.d.resizeActionIFrame(false);
				actionIframeSec = true;
			}
			var headerHeight = 0;
			var buttonsHeight = 0;
			var sectionTable = pega.util.Dom.getElementsById("EXPAND-OUTERFRAME", document.getElementById("modaldialog_bd"), "TABLE");
			if(sectionTable != null){
				sectionTable = sectionTable[0];				
				var buttonsTable = sectionTable.nextSibling;
				if(buttonsTable != null){
					while(buttonsTable.nodeType !=1){
						buttonsTable = buttonsTable.nextSibling;
						if(buttonsTable == null) break;
					}
					if(buttonsTable != null) {
						buttonsHeight = buttonsTable.offsetHeight;
					}
				}
			}
			if(document.getElementById("modaldialog_hd") != null ){
				headerHeight = document.getElementById("modaldialog_hd").offsetHeight;
			}
			//BUG-58180 12/29/2011 KODUC removing the extra space for the modal dialog. This code is added so that modal dialogs in DCO will not break when buttons height not able to get
			if(buttonsHeight == 0){
				buttonsHeight = 40;
			}
			//End of BUG-58180


			//BUG-81883 : issue with modaldialog resizing.
			//document.getElementById("modaldialog_bd").style.overflow = "hidden";
			document.getElementById("modaldialog_bd").style.overflow = pega.u.d.useOldModalDialog ? "visible":"hidden";

			if( newHeight <= (headerHeight + buttonsHeight) ){
				modalDialogContent.style.height = (headerHeight + buttonsHeight + 20) + 'px';
			}else if((newHeight - (headerHeight + buttonsHeight + adjustHeight)) > 0 ){
				modalDialogContent.style.height = (dimensionObj.height - headerHeight - buttonsHeight - adjustHeight + 5) + 'px';
			}else{
				modalDialogContent.style.height = (dimensionObj.height - headerHeight - buttonsHeight + 5) + 'px';
			}
			//BUG-59071 koduc 1/4/2012 to extra spaces in the modal dialog if Buttons Table is not present
			var modalDialog = document.getElementById("modaldialog");
			var modalDialogHeight = modalDialog.offsetHeight;
			var modalDialogFeet = document.getElementById("modaldialog_ft");
			var differenceHeight = modalDialogFeet.offsetTop + modalDialogFeet.offsetHeight;
			

			if(modalDialogHeight != differenceHeight){				
				//BUG-81883 : issue with modaldialog resizing.
				modalDialog.style.height = ((modalDialogHeight > differenceHeight)? modalDialogHeight : differenceHeight) + 'px';
			}
			//End of BUG-59071
			modalDialogContent.style.width = (dimensionObj.width - adjustment) + 'px';
			me.body = document.getElementById("modaldialog_bd");
			
		}
		
		this.ddResize.onDrag = function(e) {
			var newPos = [pega.util.Event.getPageX(e), pega.util.Event.getPageY(e)];
			var offsetX = newPos[0] - this.startPos[0];
			var offsetY = newPos[1] - this.startPos[1];
			var newWidth = Math.max(this.startWidth + offsetX, 10);
			var newHeight = Math.max(this.startHeight + offsetY, 10);

			//BUG-55153  1-12-2011 KODUC setting content min height and min width to the modal dialog 
			this.actualWidth = newWidth;
			this.actualHeight = newHeight;
			if(newWidth<=300){
				newWidth = this.actualWidth = 300;
			}
			if(newHeight<=200){
				newHeight  = this.actualHeight = 200;
			}
			//End of BUG-55153
	
			me.cfg.setProperty("width", newWidth + "px");
			me.cfg.setProperty("height", newHeight + "px");
			
			var headerHeight = 0;
			var buttonsHeight = 0;
			var sectionTable = pega.util.Dom.getElementsById("EXPAND-OUTERFRAME", document.getElementById("modaldialog_bd"), "TABLE");
			if(sectionTable != null){
				sectionTable = sectionTable[0];				
				var buttonsTable = sectionTable.nextSibling;
				if(buttonsTable != null){
					while(buttonsTable.nodeType !=1){
						buttonsTable = buttonsTable.nextSibling;
						if(buttonsTable == null) break;
					}
					if(buttonsTable != null) {
						buttonsHeight = buttonsTable.offsetHeight;
					}
				}
			}
			if(document.getElementById("modaldialog_hd") != null ){
				headerHeight = document.getElementById("modaldialog_hd").offsetHeight;
			}
			var borderElements = pega.util.Dom.getElementsById("mCurve",document.getElementById("modaldialog"));
			var borderElementsHt = 0;
			if(borderElements) {
				var borderEleLen = borderElements.length;
				for(var i = 0; i<borderEleLen; i++) {
					borderElementsHt += borderElements[i].clientHeight;
					if(pega.util.Dom.getStyle(borderElements[i],"display") == 'none') {
						borderElementsHt = 0;
						break;
					}
				}
			}
			var modalDialogBody = document.getElementById("modaldialog_bd");
			modalDialogBody.style.overflowX = "hidden";
			var modalDialogContent = $("#modaldialog_con", document.getElementById("modaldialog")).get(0);
			if(modalDialogContent) {
				while(modalDialogContent.parentNode.nodeName != "DIV"){
				modalDialogContent = modalDialogContent.parentNode;
				}
				modalDialogContent = modalDialogContent.parentNode;
			}
			else {
				modalDialogContent = modalDialogBody;
			}			
			modalDialogContent.style.width = newWidth + 'px';
			
			if( newHeight <= (headerHeight + buttonsHeight) ){
				modalDialogContent.style.height = (headerHeight + buttonsHeight + 15) + 'px';
			}else if((newHeight - (headerHeight + buttonsHeight + borderElementsHt + 40)) > 0 ){
				modalDialogContent.style.height = (newHeight - (headerHeight + buttonsHeight + borderElementsHt + 40)) + 'px';
			}
			var innerHeight = me.innerElement.offsetHeight;
			var innerWidth = me.innerElement.offsetWidth;
			if (innerWidth < 20) {
				me.innerElement.style.width = "20px";
			}
			me.fireEvent("resizeEvent", {ev: "resizeEvent", target: me});
		}

	}, this, true);

	if (userConfig) {
		this.cfg.applyConfig(userConfig, true);
	}
	this.initEvent.fire(pega.widget.ResizePanel);
};

// BEGIN BUILT-IN PROPERTY EVENT HANDLERS //

/**
* The default event handler fired when the "close" property is changed. The method controls the appending or hiding of the close icon at the top right of the Panel.
* @method configClose
* @param {String} type	The CustomEvent type (usually the property name)
* @param {Object[]}	args	The CustomEvent arguments. For configuration handlers, args[0] will equal the newly applied value for the property.
* @param {Object} obj	The scope object. For configuration handlers, this will usually equal the owner.
*/
pega.widget.ResizePanel.prototype.configClose = function(type, args, obj) {
	var val = args[0];
	var doHide = function(e, obj) {
		obj.hide();
	};
	if (val) {
		if (! this.close) {
			this.close = document.createElement("span");
			pega.util.Dom.addClass(this.close, "container-close");
			this.close.innerHTML = "&#160;";
			this.innerElement.appendChild(this.close);
			pega.util.Event.addListener(this.close, "click", doHide, this);
		} else {
			this.close.style.display = "block";
		}
	} else {
		if (this.close) {
			this.close.style.display = "none";
		}
	}
};
//static-content-hash-trigger-GCC