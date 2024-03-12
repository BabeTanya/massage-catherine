function getYtId() {
	return document.getElementById('player').attributes['x-video-id'].value;
}
function onYouTubeIframeAPIReady() {
	new YT.Player('player', {
		videoId: getYtId(),
		events: {
						'onReady': onPlayerReady,
						}
	});
}

class YoutubePlayer extends BaseVideoPlayer {
	constructor(player) {
		super()
		this.player = player
	}

	getCurrentTimestamp() {
		return this.player.getCurrentTime()
	}

	getVideoLength() {
		return this.player.getDuration()
	}

	isPlaying() {
		return this.player.getPlayerState() === 1;
	}

	getWatchbarIdent() {
		return {
			'v': getYtId(),
			'type': 'yt'
		}
	}

 seekToSec(sec) {
		this.player.seekTo(sec, true)
	}
}

function onPlayerReady(event) {
	registerPlayer(new YoutubePlayer(event.target));
}


