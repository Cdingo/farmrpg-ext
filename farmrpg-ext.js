(() => {
    let currentPort = null
    let lastSidebar = [""]

    const renderSidebar = (html) => {
        // Store the HTML for re-rendering if needed.
        lastSidebar[0] = html
        // Find or create the sidebar holder.
        let sidebarElm = document.getElementById("farmrpg-ext-sidebar")
        if (!sidebarElm) {
            const menuElm = document.querySelector(".panel-left .list-block")
            menuElm.insertAdjacentHTML("afterend", "<div id=\"farmrpg-ext-sidebar\" class=\"farmrpg-ext-sidebar\"></div>")
            sidebarElm = document.getElementById("farmrpg-ext-sidebar")
            sidebarElm.addEventListener("click", evt => {
                let target = evt.target
                while (target && !target.dataset.farmrpgextsidebarclick) {
                    target = target.parentElement
                }
                console.log("farmrpg-ext sidebar click", target)
                if (!target) {
                    return true
                }
                currentPort.postMessage({action: "SIDEBAR_CLICK", target: target.dataset.farmrpgextsidebarclick})
                evt.stopImmediatePropagation()
                return false
            })
        }
        // Insert the rendered HTML.
        sidebarElm.innerHTML = html
    }

    const messageHandler = msg => {
        switch (msg.action) {
        case "UPDATE_SIDEBAR":
            if (window.wrappedJSObject.__pause_sidebar__) {
                return
            }
            renderSidebar(msg.html)
            break
        case "RELOAD_VIEW":
            const view = window.wrappedJSObject.mainView
            if (view.url == msg.url) {
                // FS already has code in place to restore the scroll position, just use that.
                const scrollTop = view.container.querySelector('.page-on-center .page-content').scrollTop
                window.wrappedJSObject.currentScroll = scrollTop
                view.router.refreshPage()
            } else {
                view.router.loadPage(msg.url, {ignoreCache: true})
            }
            break
        }
    }

    const connect = () => {
        const port = browser.runtime.connect()
        console.debug("FarmRPG-Ext: Port connected")
        port.onMessage.addListener(messageHandler)
        port.onDisconnect.addListener(disPort => {
            console.debug("FarmRPG-Ext: Port disconnected")
            if (port === disPort) {
                connect()
            }
        })
        currentPort = port
    }
    connect()

    console.log("FarmRPG-Ext loaded!")
})();
