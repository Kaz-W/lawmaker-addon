let highlightRe = /<span class="highlight-lawmaker-info">(.*?)<\/span>/g,
    highlightHtml = '<span class="highlight-lawmaker-info">$1</span>';

let highlighted_elements = ["li", "p"]
let lawmaker_data = ""
let party_colours = ""
let enabled_on_site = 1;
let blocked = 0;

$(document).ready(async function(){

  await fetch(chrome.extension.getURL('info/lawmakers.json'))
      .then((resp) => resp.json())
      .then(function (jsonData) {
        lawmaker_data = jsonData
      });

  await fetch(chrome.extension.getURL('info/parties.json'))
      .then((resp) => resp.json())
      .then(function (jsonData) {
        party_colours = jsonData
      });

  waitForKeyElements("p", highlightLawmakers);
  //waitForKeyElements("span", highlightLawmaker);

  // Twitter specific element selectors
  // for tweets
  waitForKeyElements("article", highlightLawmakers);
  // for aside box
  waitForKeyElements("aside", highlightLawmakers);


});

function request(url) {
  var xhr = new XMLHttpRequest();
  try {
    xhr.onreadystatechange = function(){
      if (xhr.readyState != 4)
        return;

      if (xhr.responseXML) {
        console.debug(xhr.responseXML);
      }
    }

    xhr.onerror = function(error) {
      console.debug(error);
    }

    xhr.open("GET", url, true);
    xhr.send(null);
  } catch(e) {
    console.error(e);
  }
}

// prime highlighted areas for selection

$(document).on('mouseenter', '.highlight-lawmaker-info',
    function(e){
      let highlighted = $(this)
      //console.log("hovering");
      setTimeout(() => createInfoBox(highlighted, e), 400)
    });

$(document).on('mouseleave', '.highlight-lawmaker-info',
    function () {
      setTimeout(() => deleteInfoBox()
          , 300);
    });

$(document).on('mouseleave', '.image-wrapper-lawmaker',
    function () {
      setTimeout(() => deleteInfoBox()
          , 300);
    });


async function getInfoScalingDetails(){
  let getting = ""
  chrome.storage.sync.get("infobox_size", function(size){
    getting = size
  });
  let size = getting.infobox_size
  if (typeof size === "undefined"){
    chrome.storage.sync.set({infobox_size: 50});
    size = 50
  }
  //console.log("getting", size)
  switch(size) {
    case 0: return [0.6, 240, 90]
    case 25: return [0.8, 270, 87]
    case 50: return [1, 300, 86]
    case 75: return [1.2, 330, 85]
    case 100: return [1.5, 380, 84]
  }

}

async function createInfoBox(highlighted, event){
    //console.log("!!!!!!!", $("highlight-lawmaker-info:hover"))
    if ($(".image-wrapper-lawmaker").length === 0) {
      let loading_src = chrome.runtime.getURL(`imgs/thumbnails/${highlighted.text()}.jpg`)
      let values = await getInfoScalingDetails();
      //console.log("scaling ,right adjustment 1", values);
      let scaling = values[0]
      let right_adjustment = values[1]
      let vert_adjustment = values[2]

      //("scaling ,right adjustment 1", scaling, right_adjustment);

      let rt = ($(window).width() - (highlighted.offset().left + highlighted.outerWidth()) - right_adjustment);
      let position_left = highlighted.offset().left
      let position_top = highlighted.offset().top
      position_top = highlighted.offset().top + (highlighted.outerHeight()/2);
      //console.log("width of name vs screen", highlighted.outerWidth(), $(window).width())
      if (highlighted.outerWidth() > 0.5 *  $(window).width()){
        // some subjective tweaks found to make the infobox appear in a more satisfying
        // position
        let horizontal_buffer = 30;
        let vertical_buffer = 5
        //("mouse coords ", event.pageX, event.pageY)
        rt = $(window).width() - event.pageX - 300*scaling - horizontal_buffer;
        position_left = event.pageX - horizontal_buffer;
        position_top = event.pageY - vertical_buffer;
      }

      //console.log("position: half",  ($(window).width() * 0.5), "left", position_left, "top", position_top)
      // determines if infobox should be shown on left or right
      let show_infobox_right = true;
      if (position_left > ($(window).width() * 0.5)){
        // better now to show infobox on left of name
        show_infobox_right = false
      }

      let div = $('<div class="image-wrapper-lawmaker">')
          .css({
            "border": "2px solid white",
            "transform": `scale(${scaling})`,
            "position": "absolute",
            "height": "300px",
            "width": "300px",
            "background-color": "black",
            //"opacity": "0",
            "z-index": "99999"
          })

      if (show_infobox_right){
        let arrow = $('<div class="lawmaker-arrow"></div>')
        let behindArrow = $('<div class="lawmaker-arrow lawmaker-behind-arrow"></div>').css({
          "left": "-22.2px",
          "top": "62.95px",
        })
        div.append(arrow)
        div.append(behindArrow)
        div.css({
          "right": rt + 'px',
          "top": position_top - (vert_adjustment) + 'px'})

      } else {
        div.css({
          "left": position_left - right_adjustment + 'px',
          "top": position_top - (vert_adjustment) + 'px'})
        // flip arrow other direction
        //console.log("flipping arrow")
        let arrow = $('<div class="lawmaker-arrow lawmaker-arrow lawmaker-flipped-arrow"></div>').css({
          "transform": "rotate(0.5turn)",
          "left": 294 + 'px',
        })
        let behindArrow = $('<div class="lawmaker-arrow lawmaker-behind-arrow"></div>').css({
          "transform": "rotate(0.5turn)",
          "top": "62.95px",
          "left": 300 + 'px',
        })
        div.append(arrow)
        div.append(behindArrow)
      }


      div.append($(`<img class = "lawmaker-info lawmaker-source" src="${loading_src}" alt="" />`).css({
        "height": "80px",
        "width": "80px",
        "padding": "5px",
        "opacity": "0",
        "object-fit": "cover",
        "object-position": "0 0"}));

      div.appendTo(document.body);
      if (show_infobox_right) {
        // animate from the left
        $(".image-wrapper-lawmaker").animate({right: `-=${scaling * 30}px`}, 200)
      } else {
        $(".image-wrapper-lawmaker").animate({left: `-=${scaling * 30}px`}, 200)
      }
      update_loaded_images(highlighted.text())
      //chrome.runtime.sendMessage({lawmakers_id: lawmakers_id});
    }
  }

function deleteInfoBox(){
    if (!$('.image-wrapper-lawmaker').is(":hover")) {
      if ($('.lawmaker-flipped-arrow').length !== 0) {
        // then the arrow has been flipped
        $(".image-wrapper-lawmaker").animate({opacity: 0, left: "-=30px"}, 100, function () {
          $("div.lawmaker-source").remove();
          $("div.lawmaker-arrow").remove();
          $("div.image-wrapper-lawmaker").remove();
        });
      } else {
        //console.log("hovered? ", $('.image-wrapper-lawmaker').is(":hover"))
        $(".image-wrapper-lawmaker").animate({opacity: 0, right: "-=30px"}, 100, function () {
          $("div.lawmaker-source").remove();
          $("div.lawmaker-arrow").remove();
          $("div.image-wrapper-lawmaker").remove();
        });
      }
    }
}


function update_loaded_images(name){
  let lawmaker = lawmaker_data[name]
  let names = name.split(" ")
  names = [names.shift(), names.join(" ")]
  names = [names[1], names[0]]
  let constituency = lawmaker[0]
  let party = lawmaker[1]
  let wiki = lawmaker[2]
  let fb = lawmaker[3]
  let twt = lawmaker[4]
  let parl = lawmaker[5]
  let summary = lawmaker[6]
  if (summary.length > 320) {
    summary = summary.substring(0, 317) + "...";
  }
  let fb_src = chrome.runtime.getURL(`imgs/fb_icon.jpg`)
  let twt_src = chrome.runtime.getURL(`imgs/twitter_icon.png`)
  let wiki_src = chrome.runtime.getURL(`imgs/wiki_icon.png`)
  let parl_src = chrome.runtime.getURL(`imgs/scottish_parliament_icon.png`)
  //$(".lawmaker-source").animate({opacity: 1}, 200)
  let wrapper = $('.image-wrapper-lawmaker')
  wrapper.append(`<div style = "opacity: 0; background-color: ${party_colours[party]}" class="lawmaker-info party-colour"></div>`)
  wrapper.append(`<span style = "opacity: 0" class ="lawmaker-info addon-title" >Who is...?</span>`)
  wrapper.append(`<span style = "opacity: 0" class ="lawmaker-info addon-firstName">${names[1].trim()}</span>`)
  wrapper.append(`<span style = "opacity: 0" class ="lawmaker-info addon-surname">${names[0].trim()}</span>`)
  wrapper.append($(`<span style = "opacity: 0" class ="lawmaker-info lawmaker-votes-with-party">Party: <span style = "font-weight:bold">${party}</span></span>`))
  wrapper.append($(`<span style = "opacity: 0" class ="lawmaker-info lawmaker-votes-with-science"> Represents: <span style="font-weight:bold">${constituency}</span></span>`))
  $('.image-wrapper-lawmaker').append($(`<span class = "lawmaker-info" style = "opacity: 0; top: 143px; font-family: Helvetica, sans-serif; font-size: 12.5px; color:white;left: 5px;position:absolute;width:290px" alt="Facebook Page"/>${summary}<a style ="color: white" href = "${wiki}" target="_blank"">(more)</a></span>`))

  $('.image-wrapper-lawmaker').append($(`<a href = "${fb}" target="_blank"><img class = "icon1" src="${fb_src}" style = "opacity:0; top: 263px; left: 20px;position:absolute;width:30px" alt="Facebook Page"/></a>`))
  $('.image-wrapper-lawmaker').append($(`<a href = "${twt}" target="_blank"><img class = "icon2" src="${twt_src}" style = "opacity:0;top: 263px; left: 95px;position:absolute;width:30px" alt="Facebook Page"/></a>`))
  $('.image-wrapper-lawmaker').append($(`<a href = "${wiki}" target="_blank"><img class = "icon3" src="${wiki_src}" style = "opacity:0;top: 263px; left: 170px;position:absolute;width:30px" alt="Twitter Page"/></a>`))
  $('.image-wrapper-lawmaker').append($(`<a href = "${parl}" target="_blank"><img class = "icon4" src="${parl_src}" style = "opacity:0;top: 263px; left: 245px;position:absolute;width:25px" alt="Twitter Page"/></a>`))

  $(".lawmaker-info").animate({opacity: 1}, 500)
  // external link icons appear in a "wave"
  $(".icon1").animate({opacity: 1, top: "-=10px"}, 600)
  $(".icon1").hover(
      function(){$(".icon1").css({"opacity":"0.7"})},
      function(){$(".icon1").css({"opacity":"1"})}
  )
  $(".icon2").animate({opacity: 1, top: "-=10px"}, 800)
  $(".icon2").hover(
          function(){$(".icon2").css({"opacity":"0.7"})},
          function(){$(".icon2").css({"opacity":"1"})})
  $(".icon3").animate({opacity: 1, top: "-=10px"}, 1000)
  $(".icon3").hover(
      function(){$(".icon3").css({"opacity":"0.7"})},
        function(){$(".icon3").css({"opacity":"1"})})
  $(".icon4").animate({opacity: 1, top: "-=10px"}, 1200)
  $(".icon4").hover(
      function(){$(".icon4").css({"opacity":"0.7"})},
      function(){$(".icon4").css({"opacity":"1"})})
}

function manageMessage(request) {
  //console.log("request recieved", request.enabled, request.blocked)
  if (!(typeof request.blocked === "undefined")) {
    blocked = request.blocked
    console.log("blocked!")
  } else if (!(typeof request.enabled === "undefined")) {
    enabled_on_site = request.enabled
    console.log("disabled")
  }
  if (!request.details) {
    location+=""
  }
}

chrome.runtime.onMessage.addListener((request)=>manageMessage(request));

function trimURL(url){
  let domain = url.replace('http://','').replace('https://','').split(/[/?#]/)[0];
  /*if (domain.substring(0,2) !== "www"){
      console.log(domain.substring(0,2))
      return "Not on webpage."
  }*/
  if (domain.length > 26){
    return domain.substring(0, 23)+"..."
  }
  //console.log(domain.substring(0,2));
  return domain
}

function highlightLawmakers(jNode) {
  let className = jNode[0].className

  if ((className !== "highlight-lawmaker-info") && (className !== "lawmaker-info")) {

    var text = jNode[0].innerHTML;
    let archive_text = text;
    for (var lawmaker in lawmaker_data) {
      var regex = new RegExp('(?<!<[^>]*)' + lawmaker, 'ig');
      text = text.replace(regex, `<span id ="highlight-lawmaker-info" class ="highlight-lawmaker-info">${lawmaker}</span>`);
      // look for anywhere double tags have been added, and replace
      regex = new RegExp(`<span id ="highlight-lawmaker-info" class="highlight-lawmaker-info"><span id ="highlight-lawmaker-info" class="highlight-lawmaker-info">${lawmaker}</span></span>`, 'ig')
      text = text.replace(regex, `<span id ="highlight-lawmaker-info" class="highlight-lawmaker-info">${lawmaker}</span>`);
    }
  if (archive_text !== text) {
    jNode[0].innerHTML = text;
  }
  }
}

//window.addEventListener("click", notifyBackgroundPage);
// WAIT FOR KEY ELEMENT SCRIPT

/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
    that detects and handles AJAXed content.
    Usage example:
        waitForKeyElements (
            "div.comments"
            , commentCallbackFunction
        );
        //--- Page-specific function to do what we want when the node is found.
        function commentCallbackFunction (jNode) {
            jNode.text ("This comment changed by waitForKeyElements().");
        }
    IMPORTANT: This function requires your script to have loaded jQuery.
*/
function waitForKeyElements (
    selectorTxt,    /* Required: The jQuery selector string that
                        specifies the desired element(s).
                    */
    actionFunction, /* Required: The code to run when elements are
                        found. It is passed a jNode to the matched
                        element.
                    */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                        new elements even after the first match is
                        found.
                    */
    iframeSelector  /* Optional: If set, identifies the iframe to
                        search.
                    */
) {
  var targetNodes, btargetsFound;

  if (typeof iframeSelector == "undefined")
    targetNodes = $(selectorTxt);
  else
    targetNodes = $(iframeSelector).contents()
        .find(selectorTxt);

  if (targetNodes && targetNodes.length > 0) {
    targetNodes.each(function () {
      var jThis = $(this);
      var alreadyFound = jThis.data('alreadyFound') || false;

      if (!alreadyFound) {
        //--- Call the payload function.
        var cancelFound = actionFunction(jThis);
        if (cancelFound)
          btargetsFound = false;
        else
          jThis.data('alreadyFound', true);
      }
    });
  }

  //--- Get the timer-control variable for this selector.
  var controlObj = waitForKeyElements.controlObj || {};
  var controlKey = selectorTxt.replace(/[^\w]/g, "_");
  var timeControl = controlObj [controlKey];

  //--- Now set or clear the timer as appropriate.
  if (btargetsFound && bWaitOnce && timeControl) {
    //--- The only condition where we need to clear the timer.
    clearInterval(timeControl);
    delete controlObj [controlKey]
  } else {
    //--- Set a timer, if needed.
    if (!timeControl) {
      timeControl = setInterval(function () {
            waitForKeyElements(selectorTxt,
                actionFunction,
                bWaitOnce,
                iframeSelector
            );
          },
          300
      );
      controlObj [controlKey] = timeControl;
    }
  }
  waitForKeyElements.controlObj = controlObj;
}