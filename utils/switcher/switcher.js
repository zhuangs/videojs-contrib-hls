import runSimulation from './run-simulation';
import displayTimeline from './display-timeline';
import Config from '../../src/config';

// a dynamic number of time-bandwidth pairs may be defined to drive the simulation
let networkTimeline = document.querySelector('.network-timeline');
let $ = document.querySelector.bind(document);

// apply any simulation parameters that were set in the fragment identifier
if (window.location.hash) {
  // time periods are specified as t<seconds>=<bitrate>
  // e.g. #t15=450560&t150=65530
  let params = window.location.hash.substring(1)
    .split('&')
    .map(function(param) {
      return ((/t(\d+)=(\d+)/i).exec(param) || [])
        .map(window.parseFloat).slice(1);
    }).filter(function(pair) {
      return pair.length === 2;
    });

  networkTimeline.innerHTML = '';
}

// collect the simulation parameters
const parameters = function() {
  let networkTrace = $('#network-trace').value
    .trim()
    .split('\n')
    .map((line) => line.split(' ').slice(-2).map(Number));
  let playlists = $('#bitrates').value
    .trim()
    .split('\n')
    .map((line) => {
      let t = line.split(/[,\s]+/).map(Number);
      return [t[0], t[1] || t[0]];
    });

  let segments = {};
  try {
    segments = JSON.parse($('#segments').value);
  } catch(e) {
    console.log('Invalid JSON');
  }

  let goalBufferLength = Math.max(1, Number($('#goal-buffer-length').value));
  let bandwidthVariance = Math.max(0.1, Number($('#bandwidth-variance').value));

  return {
    goalBufferLength,
    bandwidthVariance,
    playlists,
    segments,
    networkTrace
  };
};

let local = $('#local');
// clear the file path to allow for reload
local.addEventListener('click', () => local.value = '');
local.addEventListener('change', function() {
  const files = local.files;

  $('#network-trace').value = '';
  // do nothing if no file was chosen
  if (!files) {
    return;
  }

  for(var i = 0; i < files.length; i++) {
    const reader = new FileReader();

    reader.addEventListener('loadend', function() {
      $('#network-trace').value += reader.result;
    });

    reader.readAsText(files[i]);
  }
});

let saveReport = $('#save-report');
let report = {};
saveReport.addEventListener('click', function(){
  const text = JSON.stringify(report, null, 2);
  const data = new Blob([text], {type: 'text/plain'});

  let textFile = window.URL.createObjectURL(data);

  let link = document.createElement('a');
  link.setAttribute('download', 'report.json');
  link.href = textFile;
  document.body.appendChild(link);

  window.requestAnimationFrame(function () {
    let event = new MouseEvent('click');
    link.dispatchEvent(event);
    document.body.removeChild(link);
    window.URL.revokeObjectURL(textFile);
  });
});

let runButton = document.getElementById('run-simulation');
runButton.addEventListener('click', function() {
  runSimulation(parameters(), function(err, res) {
    report = res;
    $('#result').innerText = JSON.stringify(res, null, 2);
    displayTimeline(err, res);
  });
});

runButton.click();
