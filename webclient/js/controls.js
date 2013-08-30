/********************************************************
 * play an uri from a trackslist or the current playlist
 *********************************************************/
function playTrack(addtoqueue) {
    //stop directly, for user feedback
    if (!addtoqueue) {
        mopidy.playback.stop(true);
    }
    $('#popupTracks').popup('close');
    $('#controlsmodal').popup('close');
    toast('Loading...');

    //function playtrack(uri, playlisturi) {
    playlisturi = $('#popupTracks').data("list");
    uri = $('#popupTracks').data("track");

    var trackslist = new Array();
    var track, tracksbefore, tracksafter;
    var tracks = getTracksFromUri(playlisturi);
    if (tracks) {
        if (!addtoqueue) {
            clearQueue();
        }
        $(CURRENT_PLAYLIST_TABLE).empty();
    } else {
        tracks = currentplaylist;
        for (var i = 0; i < tracks.length; i++) {
            if (tracks[i].uri == uri) {
                track = i + 1;
                break;
            }
        }
        for (var i = 0; i < track; i++) {
            mopidy.playback.next();
        }
        mopidy.playback.play();
        return false;
    }

//find track that was selected
    for (var selected = 0;  selected < tracks.length; selected++) {
        if (tracks[selected].uri == uri) {
	    break;
	}
    }

//find track that is playing
    for (var playing = 0; playing < currentplaylist.length; playing++) {
        if (currentplaylist[playing].uri == songdata.uri) {
	    break;
	}
    }

//switch popup options
    switch (addtoqueue) {
	case ADD_THIS_BOTTOM:
            mopidy.tracklist.add(tracks.slice(selected, selected + 1));
	    return false;
	case PLAY_NEXT:
	    mopidy.tracklist.add(tracks.slice(selected, selected + 1), playing + 1);
	    return false;
	case ADD_ALL_BOTTOM:
            mopidy.tracklist.add(tracks);
	    return false;
    }

// first add track to be played, then the other tracks
    mopidy.tracklist.add(tracks.slice(selected, selected + 1) );
    //wait 1.5 second before adding the rest to give server the time to start playing
    setTimeout(function() {
        mopidy.tracklist.add(tracks.slice(0, selected), 0);
	if (selected < tracks.length) {
            mopidy.tracklist.add(tracks.slice(selected + 1) );
	}
    }, (1500));
    mopidy.playback.play();
    return false;
}

function clearQueue () {
    mopidy.tracklist.clear();
    return false;
}

/**********************
 * Buttons
 */

function doShuffle() {
    mopidy.playback.stop(true);
    mopidy.tracklist.shuffle();
    mopidy.playback.play();
}

/* Toggle state of play button */
function setPlayState(nwplay) {
    if (nwplay) {
        $("#playimg").attr('src', 'images/icons/pause_32x32.png');
    } else {
        $("#playimg").attr('src', 'images/icons/play_alt_32x32.png');
    }
    play = nwplay;
}

//play or pause
function doPlay() {
    toast('Please wait...', 250);
    if (!play) {
        mopidy.playback.play();
    } else {
        mopidy.playback.pause();
    }
    setPlayState(!play);
}

function doPrevious() {
    toast('Playing previous track...');
    mopidy.playback.previous();
}

function doNext() {
    toast('Playing next track...');
    mopidy.playback.next();
}

function backbt() {
    history.back();
    return false;
}

/***************
 * Options
 */

function setRepeat(nwrepeat) {
    if (repeat == nwrepeat) {
        return
    }
    if (!nwrepeat) {
        $("#repeatbt").attr('src', 'images/icons/reload_alt_18x21.png');
    } else {
        $("#repeatbt").attr('src', 'images/icons/reload_18x21.png');
    }
    repeat = nwrepeat;
}

function setRandom(nwrandom) {
    if (random == nwrandom) {
        return
    }
    if (!nwrandom) {
        $("#randombt").attr('src', 'images/icons/loop_alt2_24x21.png');
    } else {
        $("#randombt").attr('src', 'images/icons/loop_24x24.png');
    }
    random = nwrandom;
}

function doRandom() {
    if (random == false) {
        mopidy.playback.setRandom(true);
    } else {
        mopidy.playback.setRandom(false);
    }
    setRandom(!random);
}

function doRepeat() {
    if (repeat == false) {
        mopidy.playback.setRepeat(true).then();
    } else {
        mopidy.playback.setRepeat(false).then();
    }
    setRepeat(!repeat);
}

/*********************
 * Track Slider
 * Use a timer to prevent looping of commands
 *********************/

function doSeekPos(value) {
    var val = $("#trackslider").val();
    newposition = Math.round(val);
    if (!initgui) {
        pauseTimer();
        //set timer to not trigger it too much
        clearTimeout(seekTimer);
	$("#songelapsed").html(timeFromSeconds(val / 1000));
        seekTimer = setTimeout(triggerPos, 500);
    }
}

function triggerPos() {
    if (mopidy) {
        posChanging = true;
//        mopidy.playback.pause();
//	console.log(newposition);
        mopidy.playback.seek(newposition);
//        mopidy.playback.resume();
	resumeTimer();
        posChanging = false;
    }
}

function setPosition(pos) {
    if (posChanging) {
        return;
    }
    var oldval = initgui;
    if (pos > songlength) {
        pos = songlength;
        pauseTimer();
    }
    currentposition = pos;
    initgui = true;
    $("#trackslider").val(currentposition).slider('refresh');
    initgui = oldval;
    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

/********************
 * Volume slider
 * Use a timer to prevent looping of commands
 */

function setVolume(value) {
    var oldval = initgui;
    initgui = true;
    $("#volumeslider").val(value).slider('refresh');
    initgui = oldval;
}

function doVolume(value) {
    if (!initgui) {
        volumeChanging = value;
        clearInterval(volumeTimer);
        volumeTimer = setTimeout(triggerVolume, 500);
    }
}

function triggerVolume() {
    mopidy.playback.setVolume(parseInt(volumeChanging));
    volumeChanging = 0;
}

function doMute() {
    //only emit the event, not the status
    if (muteVolume == -1) {
        $("#mutebt").attr('src', 'images/icons/volume_mute_24x18.png');
        muteVolume = currentVolume;
        mopidy.playback.setVolume(0).then();
    } else {
        $("#mutebt").attr('src', 'images/icons/volume_24x18.png');
        mopidy.playback.setVolume(muteVolume).then();
        muteVolume = -1;
    }

}

/*******
 * Track timer
 */

//timer function to update interface
function updateTimer() {
    currentposition += TRACK_TIMER;
    setPosition(currentposition);
    //    $("#songelapsed").html(timeFromSeconds(currentposition / 1000));
}

function resumeTimer() {
    pauseTimer();
    if(songlength > 0) {
	posTimer = setInterval(updateTimer, TRACK_TIMER);
    }
}

function initTimer() {
    pauseTimer();
    // setPosition(0);
    resumeTimer();
}

function pauseTimer() {
    clearInterval(posTimer);
}

/*********************************
 * Radio
 *********************************/
function radioPressed(key) {
    if (key == 13) {
        addRadioUri();
        return false;
    }
    return true;
}

function addRadioUri(value) {
    var value = value || $('#radioinput').val();
    if (validUrl(value)) {
        showLoading(true);
	//stop directly, for user feedback
	mopidy.playback.stop(true);
        //hide ios/android keyboard
        document.activeElement.blur();
        $("input").blur();
	clearQueue();
        mopidy.tracklist.add(null,null, value );
	//add station to list and check for doubles
        for (var key in radioStations) {
	    rs = radioStations[key];
	    if (rs[1] == value) { 
		delete radioStations[key];
	    }
	};
	radioStations.unshift(['', value]);
        mopidy.playback.play();
	updateRadioStations();
	showLoading(false);
    } else {
	toast ('No valid url!');
    }
    return false;
}

function updateRadioStations() {
    var tmp = '';
    $('#radiostationstable').empty();
    var child = '';
    for (var key in radioStations) {
	var rs = radioStations[key];
	if(rs) {
	  name = rs[0] || rs[1];
          child = '<li><a href="#" onclick="return addRadioUri(\'' + rs[1] + '\');">';
          child += '<h1>' + name + '</h1></a></li>';
          tmp += child;
	}
    };
    $('#radiostationstable').html(tmp);
}

function initRadio() {
    radioStations.push(['3FM', 'http://icecast.omroep.nl/3fm-bb-mp3']);
    radioStations.push(['', 'http://icecast-bnr.cdp.triple-it.nl/bnr_mp3_128_03']);
    radioStations.push(['Arrow', 'http://81.173.3.132:8082']);
    radioStations.push(['', 'http://icecast.omroep.nl/radio1-bb-mp3']);
    updateRadioStations();
}