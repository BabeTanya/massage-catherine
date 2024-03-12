function cvlottie_loadAnimation(element){
    let path = element.attr("src");
    let loop = element.attr("loop")=="loop";
    let autoplay = element.attr("autoplay")=="autoplay";
    let animData = {
        container: element[0],
        renderer: "svg",
        loop: loop,
        autoplay: autoplay,
        rendererSettings: {
            progressiveLoad: true,
            preserveAspectRatio: "xMidYMid meet",
            imagePreserveAspectRatio: "xMidYMid meet"
        },
        path: path
    };
    let anim = lottie.loadAnimation(animData);
    anim.setSubframe(false);
    return anim;
}