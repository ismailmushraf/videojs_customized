
const segments = [
    // start defined in Seconds. 
    { start: 0, end: 60, title: 'Intro' },
    { start: 62, end: 120, title: 'HTML' },
    { start: 120, end: 180, title: 'CSS' },
    { start: 180, end: 210, title: 'JavaScript' }
];

let sideBarOpened = false;

function modifyTimeline(segment, startPosition, endPosition) {
    const playerTimeLine = player.el().querySelector('.vjs-progress-holder');

    // The black points shown in the Video timeline
    // Start point of a segment
    const segmentMarker = document.createElement('div');
    segmentMarker.style.left = startPosition + '%';
    segmentMarker.classList.add('vjs-segment-marker');
    playerTimeLine.appendChild(segmentMarker);

    // The title bar appearing while hovering on video timeline
    const segmentTitlePopup = document.createElement('div');
    segmentTitlePopup.innerText = segment.title;
  
    segmentTitlePopup.style.left = startPosition + '%';
    segmentTitlePopup.classList.add('vjs-segment-title');
    playerTimeLine.appendChild(segmentTitlePopup);

    // an extra layer of div block placed above the timeline 
    // according to the width of each segment
    // helps to inject listeners for each segment and show different titles as we move along
    const segmentOverlay = document.createElement('div');
    segmentOverlay.classList.add('vjs-segment-overlay');
    segmentOverlay.style.left = `${startPosition}%`;
    segmentOverlay.style.width = `${endPosition - startPosition}%`;
    playerTimeLine.appendChild(segmentOverlay);

    segmentOverlay.addEventListener('mousemove', (event) => {
        const playerTimeLineOffset = (segmentOverlay.style.left.split('%')[0] / 100) * playerTimeLine.clientWidth;
        let segmentTitlePopupWidth = segmentTitlePopup.clientWidth;
        segmentTitlePopup.style.left = `${event.offsetX - (segmentTitlePopupWidth / 2) + playerTimeLineOffset}px`;
        segmentTitlePopup.classList.add('vjs-segment-title-show');
    });

    segmentOverlay.addEventListener('mouseout', (event) => {
        segmentTitlePopup.classList.remove('vjs-segment-title-show');
    });
}

function renderCheckpointsSidebar() {
    const videoFrame = player.el().querySelector('.vjs-text-track-display');

    const checkpointsIcon = document.createElement('i');
    checkpointsIcon.id = 'checkpointsIcon';
    checkpointsIcon.classList.add('fa-solid', 'fa-bars');
    checkpointsIcon.style.pointerEvents = 'auto';

    const checkpointsSidebar = document.createElement('div');
    checkpointsSidebar.style.pointerEvents = 'auto';

    checkpointsIcon.addEventListener('click', (event) => {
        if (sideBarOpened) {
            closeSideBar();
        } else {
            openSideBar();
        }
    });

    checkpointsSidebar.classList.add('checkpoints-sidebar');
    videoFrame.appendChild(checkpointsIcon);
    videoFrame.appendChild(checkpointsSidebar);

    segments.forEach(segment => {
        createCheckpointCard(checkpointsSidebar, segment);
    });
}

function buildSidebar() {
    let sideBar = document.querySelector('.checkpoints-sidebar');
    if (!sideBar) {
        renderCheckpointsSidebar();
    }
}

function createCheckpointCard(checkpointsSidebar, segment) {
    const checkpointCard = document.createElement('div');
    let minutes = Math.floor(segment.start / 60).toString();
    if (minutes.length == 1) minutes = '0' + minutes;
    let seconds = (segment.start % 60).toString();
    if (seconds.length == 1) seconds = seconds + '0';
    checkpointCard.innerText = segment.title + ' - ' + minutes + ':' + seconds;
    checkpointCard.classList.add('checkpoint-card');
    checkpointsSidebar.appendChild(checkpointCard);

    checkpointCard.addEventListener('click', (event) => {
        scrollToSegment(segment.start);
    });
}

function scrollToSegment(startTime) {
    player.currentTime(startTime);
    player.play();
}

function openSideBar() {
    const checkpointsIcon = document.querySelector('.fa-bars');
    const checkpointsSidebar = document.querySelector('.checkpoints-sidebar');
    checkpointsIcon.style.left = '21%';
    checkpointsSidebar.style.display = 'block';
    sideBarOpened = true;
}

function closeSideBar() {
    const checkpointsIcon = document.querySelector('.fa-bars');
    const checkpointsSidebar = document.querySelector('.checkpoints-sidebar');
    checkpointsIcon.style.left = '10px'; // Hard coded value. need to change according to the width of checkPointsSidebar
    checkpointsSidebar.style.display = 'none';
    sideBarOpened = false;
}

var player = videojs(
    'my-video',
    {
        controls: true,
        fluid: true,
        html5: {
            vhs: {
                overrideNative: true
            }
        }
    },
    function () {
        var player = this;
        player.eme();
        player.src(
            {
                src: 'https://cdn.bitmovin.com/content/assets/art-of-motion_drm/mpds/11331.mpd',
                type: 'application/dash+xml',
                keySystems: {
                    'com.widevine.alpha': 'https://cwip-shaka-proxy.appspot.com/no_auth',
                },
            });


        player.ready(function () {

            player.on("loadedmetadata", () => {
                const duration = player.duration();

                segments.forEach((segment) => {
                    let startPosition = segment.start / duration * 100;
                    let endPosition = segment.end / duration * 100;
                    modifyTimeline(segment, startPosition, endPosition);
                });
            });

            player.tech(true).on('keystatuschange', function (event) {
                console.log("event: ", event);
            });

            player.on("fullscreenchange", () => {
                // when we enter/exit full screen the checkpoints bar gets destroyed. 
                setTimeout(() => {
                    buildSidebar();
                }, 1000);
            });

            player.on("play", () => {
                buildSidebar();
            });

            player.on("useractive", () => {
                const checkpointsIcon = document.querySelector('.fa-bars');
                const checkpointsSidebar = document.querySelector('.checkpoints-sidebar');
                if (checkpointsSidebar) {
                    checkpointsIcon.style.display = 'block';
                }
            });

            player.on("userinactive", () => {
                const checkpointsIcon = document.querySelector('.fa-bars');
                const checkpointsSidebar = document.querySelector('.checkpoints-sidebar');
                if (checkpointsSidebar) {
                    closeSideBar();
                    checkpointsIcon.style.display = 'none';
                }
            })

        });
    }

);