let systemwidemsgWorker;
$(document).ready(function(){
    systemwidemsg_activateFeature();
    systemwidemsgWorker = setInterval(systemwidemsg_activateFeature,60000);
});
function systemwidemsg_activateFeature(){
    $(".cvsystemwidemsg-msg").each(function(){
        if($(this).attr("data-display-daily")!=undefined){
            const periods = $(this).attr("data-display-daily").split("-");
            const startHourMin = periods[0].split(":");
            const endHourMin = periods[1].split(":"); 
            const h = new Date().getHours();
            const m = new Date().getMinutes();
            const startMin = parseInt(startHourMin[0])*60+parseInt(startHourMin[1]);
            const endMin = parseInt(endHourMin[0])*60+parseInt(endHourMin[1]);
            const nowMin = h*60+m;
            if(nowMin >= startMin && nowMin <= endMin){
                $(this).fadeIn();
                $(this).attr("aria-hidden","false");
            }else{
                $(this).fadeOut();
                $(this).attr("aria-hidden","true");
            }
        }
        if($(this).attr("data-randomly-pick-one")=="1"){
            let allIDs = [];
            $(this).children().each(function(){
                allIDs.push($(this).attr("data-rand-id"));
                $(this).hide();
            });
            const visibleID = allIDs[Math.floor(Math.random()*allIDs.length)];
            $(this).children("[data-rand-id='"+visibleID+"']").show();
        }
    });
}