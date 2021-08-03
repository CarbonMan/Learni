/**
* https://stackoverflow.com/questions/32729496/vanilla-js-modal-with-good-iframe-support
*/
T$.Dialog = function(content, config){
  /*
  content: selector, element, or text to wrap into dialog body
  config object parameters:
    modal: boolean,
    dialogClass: text,
    createCallBack, renderCallBack, showCallBack, hideCallBack, toggleCallBack: functions
  */
  
  var self = this;
  
  this.config = config || {};
  
  // <iframe name="iframe1" src="about:blank""></iframe>
  self.content = document.createElement("iFrame");
  self.content.src = "about:blank";
  self.content.id = "TopicalPopup";
  //document.appendChild(iFrame);
  
  this.init = function(){
    //check for an element passed as content or a selector corresponding to an element
    /*
    self.content = content.tagName ? content : document.querySelector(content);
    if( ! self.content){
      //otherwise content is text to be appended to the dialog body
      self.content = document.createElement("div");
      self.content.innerText = content;
    }
    */
    self.container = self.create();
    self.body.appendChild(self.content);
    if(document.body){
      self.render();
    }else{
      document.body.addEventListener("load", self.render);
    }
    
    window.addEventListener("resize", function(){
      self.size();
    })
    
    return self;
  }
  
  this.create=function create(){
    self.container = document.createElement("div");
    self.dialog = document.createElement("div");
    self.head = document.createElement("h2");
    self.closeButton = document.createElement("button");
    self.body = document.createElement("div");
    self.head.innerText = self.config.headerText || "";
    self.dialog.appendChild(self.head);
    self.dialog.appendChild(self.closeButton);
    self.container.appendChild(self.dialog);
    self.dialog.appendChild(self.body);
    self.body.appendChild(self.content);
    self.container.className = "dialog-container" + (self.config.modal ? " modal" : "");
    self.dialog.className = "dialog " + self.config.dialogClass || "";
    self.head.className = "dialog-head";
    self.body.className = "dialog-body";
    self.closeButton.className = "dialog-close";
    self.closeButton.innerText = self.config.closeButtonText || "close";
   self.closeButton.title = self.config.closeButtonText || "close"; self.closeButton.addEventListener("click", self.hide);
    self.closeButton.setAttribute("type","button");
    self.checkCallBack();
    return self.container;
  }
  
  this.render = function render(){
    document.body.appendChild(self.container);
    self.checkCallBack(arguments);
    return self.dialog;
  }
  
  this.show = function(_opts){
    document.getElementById("TopicalPopup").src = opts.url;
    setTimeout(function(){
      self.container.classList.add("visible");
      self.closeButton.focus();
      self.checkCallBack(arguments); 
      return self.container;
    },0);
  }
  
  this.hide = function hide(){
    var iframe = self.dialog.querySelector("iframe");
    if(iframe){
      iframe.setAttribute("src","about:blank");
    }
    self.container.classList.remove("visible");
    self.checkCallBack(arguments);
    return self.container;
  }
  
  this.toggle = function(){
    if(self.dialog.classList.contains("visible")){
      self.hide();
    }else{
      self.show();
    }
    self.checkCallBack(arguments);
    return self.container;
  }
  
  this.size = function(){
    var padding = 80;
    self.body.style.maxHeight = window.innerHeight - self.head.offsetHeight - padding + "px";
    console.log(self.body.style.maxHeight);
    return self.body.style.maxHeight;
  }
  
  this.checkCallBack = function(args){
    var action = arguments.callee.caller.name,
    	callBackName = action + "CallBack",
      args = Array.prototype.slice.call(args || []),
      fn = self.config[callBackName];
      
    if(fn){
      args.unshift(action);
      fn.apply(self, args);
    }
    
    return !!fn;
  }

  this.init();
}

T$.modal = new T$.Dialog({modal: true, dialogClass: "foo", headerText: "New Dialog", hideCallBack: function(){
  console.log(this, arguments);
}});

// Style the iFrame
T$.popupCss = `
.dialog-container{
  visibility: hidden;
}

.dialog-container.visible{
  visibility: visible;
}

.modal{
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: rgba(50, 50, 50, 0.2);
  z-index: 100;
}

.dialog-container.visible .dialog{
  opacity: 1;
}

.dialog{
  position: relative;
  background-color: white;
  padding: 0;
  width: 600px;
  max-width: 100%;
  margin: auto;
  margin-top: 20px;
  opacity: 0;
  transition: opacity .8s ease-in-out;
  -moz-transition: opacity .8s ease-in-out;
  -webkit-transition: opacity .8s ease-in-out;
  padding-bottom: 10px;
}

.dialog-head,
.dialog-body{
  padding: 10px 30px;
}

.dialog-head{
  margin: 0;
  border-bottom: solid 1px #999999;
}

.dialog-close, 
.dialog-close:before{
  position: absolute;
  display: block;
  top: 0;
  right: 0;
  width: 50px;
  height: 50px;
  line-height: 50px;
  padding: 0;
  border: none;
  background-color: transparent;
}

.dialog-close{
  text-indent: -1000px;
  overflow: hidden;
}

.dialog-close:before{
  content: "\00D7";
  font-size: 30px;
  text-indent: 0;
}

.dialog-body{
  padding-bottom: 0;
  overflow: hidden;
}

.dialog iframe{
  min-height: 300px;
  border: none;
  width: 100%;
}`;
T$.addStyleSheet(T$.popupCss);
