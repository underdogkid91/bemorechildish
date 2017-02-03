(function () {
  window.BOWL = new LASAGNA.BOWL(document.querySelectorAll('.player')[0]);
  var filename = window.location.hash.split('&')[0].replace(/^\#/, '');
  var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
      if (xmlhttp.readyState == XMLHttpRequest.DONE ) {
        if (xmlhttp.status == 200) {
          BOWL.fromJSON(xmlhttp.responseText);
          BOWL.loop();
        }
        else {
          alert('something else other than 200 was returned');
        }
      }
    };
    xmlhttp.open('GET', '/files/' + filename, true);
    xmlhttp.send();
})();
