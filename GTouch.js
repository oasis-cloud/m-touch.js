(function(window){  
    //配置事件，可在初始化的时候进行再次配置，这里仅仅是默认配置  
    var evtConfig = {  
        TapTime:300,  
        HoldTime:600,  
        SwipeMinDis:50,  
        zoom:1,  
        tap:true,  
        doubletap:true,  
        hold:true,  
        swipeup:true,  
        swipedown:true,  
        swipeleft:true,  
        swiperight:true,  
        pinch:true,  
        zoomout:true,  
        zoomin:true,  
    };  
    //定义共享状态用的参数  
    var Share = {  
        TouchStartTime:null,  
        HoldTimer:null,  
        TapTimer:null,  
        prevTouchTime:null,  
        originalSpacing:null,  
        StartTouch:false,  
        StartMove:false,  
        FingerPos:{touchstart:[],touchmove:[],touchend:[],touchcancle:[]},  
    };  
      
    var getFingers = function(evt) {  
        return evt.targetTouches ? evt.targetTouches.length : 0;  
    },  
    getFingersPos = function(evt) {  
        var touch = null, fingers = getFingers(evt), et = evt.type;  
        if(getFingers(evt) < 2) {  
            touch = evt.targetTouches[0];  
            Share.FingerPos[et][0] = [];  
            Share.FingerPos[et][0].push({x:touch.pageX, y:touch.pageY});  
            var temp = Share.FingerPos[et][0].x;  
        } else {  
            for(var i = 0; i < fingers; i++) {  
                touch = evt.touches[i];  
                Share.FingerPos[et].push(touch);  
            }  
        }  
    },  
    getDotDistance = function(tStart, tMove) {  
        var result = {x:null, y:null}, dis = null;  
        result.x =tMove.pageX - tStart.pageX;  
        result.y =tMove.pageY - tStart.pageY;  
        dis = Math.sqrt( (result.x * result.x) + (result.y * result.y) );  
        return dis;  
    };  
    //处理原生事件  
    var handleNativeEvent = function(evt) {  
        evt.preventDefault();  
        var el = evt.target, et = evt.type;  
        switch(et) {  
            case 'touchstart':  
                if(!evtConfig.hold) return false;  
                Share.FingerPos = {touchstart:[],touchmove:[],touchend:[],touchcancle:[]};  
                getFingersPos(evt);  
                Share.TouchStartTime = Date.now();  
                if(evtConfig.hold && evtConfig.HoldTime && getFingers(evt) < 2)  {  
                    extEvent.hold(evt);  
                }  
                if(getFingers(evt) >= 2) {  
                    Share.originalSpacing = getDotDistance(Share.FingerPos.touchstart[0], Share.FingerPos.touchstart[1]);  
                }  
                break;  
            case 'touchmove':  
                Share.FingerPos.touchmove = [];  
                getFingersPos(evt);  
                if(getFingers(evt) >= 2 && Share.FingerPos.touchstart.length >= 2 ) {  
                    if(evtConfig.pinch) extEvent.pinch(evt);  
                } else {  
                    if(evtConfig.swipe && evtConfig.SwipeMinDis && Share.FingerPos.touchstart[0]) extEvent.swipe(evt);  
                }  
                break;  
            case 'touchend':  
            case 'touchcancle':  
                Share.FingerPos = {touchstart:[],touchmove:[],touchend:[],touchcancle:[]};  
                if(evtConfig.tap && evtConfig.TapTime && getFingers(evt) < 2)  {  
                    extEvent.tap(evt);  
                }  
                break;  
        }  
    };  
    //扩展出来的事件  
    var extEvent = {  
        hold : function(evt) {  
            clearTimeout(Share.TapTimer);  
            clearTimeout(Share.HoldTimer);  
            Share.TapTimer = setTimeout(function(){  
                Observer.fire('hold', evt);  
            }, evtConfig.HoldTime);  
        },  
        tap : function(evt) {  
            clearTimeout(Share.HoldTimer);  
            clearTimeout(Share.TapTimer);  
            if(evtConfig.doubletap && Share.prevTouchTime && (Share.TouchStartTime - Share.prevTouchTime  < 300)) {  
                Share.TapTimer = setTimeout(function(){  
                    Observer.fire('doubletap', evt);  
                }, evtConfig.TapTime);  
            } else {  
                Share.TapTimer = setTimeout(function(){  
                    Observer.fire('tap', evt);  
                }, evtConfig.TapTime);  
            }  
            Share.prevTouchTime = Date.now();  
        },  
        swipe : function(evt) {  
            var timeDif = Share.TouchStartTime - Date.now();  
            var direction = null, degree = null;  
            var dotDistance = getDotDistance(Share.fingerPos.touchstart[0], Share.fingerPos.touchmove[0]);  
            if(dotDistance.dis <= evtConfig.SwipeMinDis) return false;  
            if(Share.Swipe) {  
                Share.Swipe = false;  
                return false;  
            }  
            degree = Math.atan2(dotDistance.y, dotDistance.x) * 180 / Math.PI;  
            if(degree < -45 && degree > -135) {  
                direction = 'swipeup';  
            }  
            if(degree >= 45 && degree < 135) {  
                direction = 'swipedown';  
            }  
            if(degree >=135 || degree <= -135) {  
                direction = 'swipeleft';  
            }  
            if(degree >= -45 && degree <= 45) {  
                direction = 'swiperight';  
            }  
            Share.Swipe = true;  
            Observer.fire(direction, evt);  
        },  
        pinch : function(evt) {  
            var moveDis = getDotDistance(Share.FingerPos.touchmove[0], Share.FingerPos.touchmove[1]);  
            var scalerate = moveDis / Share.originalSpacing * 100;  
            var evtobj = {  
                oevent : evt,  
                rate : scalerate  
            };  
            if(moveDis < Share.originalSpacing) {  
                Observer.fire('zoomin', evtobj);  
            }  
            if(moveDis > Share.originalSpacing) {  
                Observer.fire('zoomout', evtobj);  
            }  
        }  
    };  
      
    //观察者模式，用于添加自定义事件  
    var Observer = {  
        topics : {},  
        subid : -1,  
        on : function(el, evt, fn) {  
            if(this.topics[evt] === undefined) {  
                this.topics[evt] = [];  
            }  
            var token = (++this.subid).toString();  
            this.topics[evt].push({  
                token : token,  
                func : fn  
            });  
            return token;  
        },  
        fire : function(evt, args) {  
            if(!this.topics[evt]) return false;  
            var ons = this.topics[evt],  
            len = ons ? ons.length : 0;  
            while(len--) {  
                ons[len].func(args);  
            }  
        },  
        unbind : function(evt, token) {   
            if(topics[evt]) {  
                for(var i = 0, j = topics[evt].length; i < j; i++) {  
                    if(topics[evt][i].token === token) {  
                        topics[evt] = topics[evt].slice(i, 1);  
                        return token;  
                    }  
                }  
            }  
            return false;  
        }  
    };  
    //工具继承函数  
    var extend = function(objsrc, exted) {  
        if(typeof objsrc != 'object') return objsrc;  
        if(typeof exted != 'object') return objsrc;  
        for(var i in exted) {  
            objsrc[i] = exted[i];  
        }  
        return objsrc;  
    }  
    //主入口  
    var GTouch = {  
        types : ['touchstart', 'touchmove', 'touchend', 'touchcancle'],  
        init : function(el, evt, fn, config){  
            if(el === undefined) throw 'No element selected!';  
            if(config)  evtConfig = extend(evtConfig, config);  
            if(fn === undefined && evt === undefined) {  
                this.types.forEach(function(item, index, arrs){  
                    el.addEventListener(item, handleNativeEvent, false);  
                });  
            } else {  
                el.addEventListener(evt, fn, false);  
            }  
        },  
        on : function(el, evt, fn) {  
            if(typeof el != 'object') return;  
            if(typeof evt != 'string') return;  
            if(typeof fn != 'function') return;  
            Observer.on(el, evt, fn);  
        }  
    };  
    window._g = GTouch;  
})(window); 
