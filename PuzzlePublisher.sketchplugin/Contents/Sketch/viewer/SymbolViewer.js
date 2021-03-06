class SymbolViewer extends AbstractViewer {
    constructor() {
        super()
        this.createdPages = {}
        this.currentLib = ""
        this.showSymbols = false
    }

    initialize(force = false) {
        if (!force && this.inited) return

        // populate library select
        const libSelect = $('#symbol_viewer #lib_selector')
        libSelect.append($('<option>', {
            value: "",
            text: 'Library autoselection'
        }));
        for (const libName of Object.keys(symbolsData)) {
            libSelect.append($('<option>', {
                value: libName,
                text: libName
            }));
        }
        libSelect.change(function () {
            var libName = $(this).children("option:selected").val();
            viewer.symbolViewer._selectLib(libName)

        })
        //
        const symCheck = $('#symbol_viewer_symbols')
        symCheck.click(function () {
            viewer.symbolViewer._setSymCheck($(this).is(':checked'))

        })

        this.inited = true
    }

    _setSymCheck(showSymbols) {
        this.showSymbols = showSymbols
        this._reShowContent()

    }

    // called by Viewer
    pageChanged() {

    }

    _selectLib(libName) {
        this.currentLib = libName
        this._reShowContent()
    }

    _reShowContent() {
        delete this.createdPages[viewer.currentPage.index]

        // remove existing symbol links
        this.page.linksDiv.children(".modalSymbolLink,.symbolLink").remove()
        for (const panel of this.page.fixedPanels) {
            panel.linksDiv.children(".modalSymbolLink,.symbolLink").remove()
        }

        // redraw inspector
        this._showEmptyContent()

        // rebuild links
        this._buildSymbolLinks()
    }


    toggle() {
        return this.visible ? this.hide() : this.show()
    }



    _hideSelf() {
        var isModal = viewer.currentPage && viewer.currentPage.isModal
        if (isModal) {
            $(".modalSymbolLink").remove()
            delete this.createdPages[viewer.currentPage.index]
        }
        const contentDiv = isModal ? $('#content-modal') : $('#content')
        contentDiv.removeClass("contentSymbolsVisible")

        viewer.linksDisabled = false
        $('#symbol_viewer').addClass("hidden")

        super._hideSelf()
    }

    handleKeyDown(jevent) {

        const event = jevent.originalEvent

        if (77 == event.which) { // m
            // Key "M" eactivates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDown(jevent)
        }

        jevent.preventDefault()
        return true
    }

    handleKeyDownWhileInactive(jevent) {
        const event = jevent.originalEvent

        if (77 == event.which) { // m
            // Key "M" activates Symbol Viewer
            this.toggle()
        } else {
            return super.handleKeyDownWhileInactive(jevent)
        }

        jevent.preventDefault()
        return true
    }

    _showSelf() {
        if (!this.inited) this.initialize()

        viewer.toggleLinks(false)
        viewer.toogleLayout(false)
        viewer.linksDisabled = true

        this._buildSymbolLinks()

        var isModal = viewer.currentPage && viewer.currentPage.isModal
        const contentDiv = isModal ? $('#content-modal') : $('#content')
        contentDiv.addClass("contentSymbolsVisible")

        this._showEmptyContent()

        $('#symbol_viewer').removeClass("hidden")

        super._showSelf()

    }

    _showEmptyContent() {
        $("#symbol_viewer_content").html("")
        $('#symbol_viewer #empty').removeClass("hidden")
    }

    _buildSymbolLinks() {
        this._showPage(viewer.currentPage)
        for (let overlay of viewer.currentPage.currentOverlays) {
            this._showPage(overlay)
        }
    }


    _showPage(page) {
        var pageIndex = page.index
        this.pageIndex = pageIndex
        this.page = page
        if (!(pageIndex in this.createdPages)) {
            const newPageInfo = {
                layerArray: []
            }
            // cache only standalone pages
            this.createdPages[pageIndex] = newPageInfo

            this.pageInfo = newPageInfo
            this._create()
        } else {
            this.pageInfo = this.createdPages[pageIndex]
        }
    }



    _create() {
        this._processLayerList(layersData[this.pageIndex].c)
    }

    _processLayerList(layers, isParentSymbol = false) {
        for (var l of layers) {
            if (this.currentLib != "") {
                if (this.showSymbols && l.b) {
                    if (l.b == this.currentLib) {
                        this._showElement(l)
                        continue
                    }
                }
                if (!this.showSymbols && undefined != l.l) {
                    const styleInfo = this._findStyleAndLibByStyleName(l.l)
                    if (styleInfo && styleInfo.libName == this.currentLib) {
                        this._showElement(l)
                        continue
                    }
                }
            } else {
                if ((this.showSymbols && l.s != undefined) || (!this.showSymbols && !isParentSymbol && l.l != undefined)) {
                    this._showElement(l)
                }
            }
            this._processLayerList(l.c, this.showSymbols && l.s != undefined)
        }
    }

    _showElement(l) {

        var currentPanel = this.page

        for (const panel of this.page.fixedPanels) {
            if (l.x >= panel.x && l.y >= panel.y &&
                ((l.x + l.w) <= (panel.x + panel.width)) && ((l.y + l.h) <= (panel.y + panel.height))
            ) {
                currentPanel = panel
                break
            }
        }



        const layerIndex = this.pageInfo.layerArray.length
        this.pageInfo.layerArray.push(l)

        var a = $("<a>", {
            class: viewer.currentPage.isModal ? "modalSymbolLink" : "symbolLink",
            pi: this.pageIndex,
            li: layerIndex,
        })

        a.click(function () {
            const sv = viewer.symbolViewer
            const pageIndex = $(this).attr("pi")
            const layerIndex = $(this).attr("li")
            const layer = sv.createdPages[pageIndex].layerArray[layerIndex]

            var symName = sv.showSymbols ? layer.s : null
            var styleName = layer.l
            var comment = layer.comment
            var frameX = layer.x
            var frameY = layer.y
            var frameWidth = layer.w
            var frameHeight = layer.h

            const styleInfo = styleName != undefined ? viewer.symbolViewer._findStyleAndLibByStyleName(styleName) : undefined
            const symInfo = symName != undefined ? viewer.symbolViewer._findSymbolAndLibBySymbolName(symName) : undefined


            var info = ""
            if (symName != undefined) {
                info = "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Symbol" + "</div>" +
                    "<div class='value'>" + symName + "</div>" +
                    "</div>"

                info += "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Symbol source" + "</div>" +
                    "<div class='value'>"
                if (layer.b != undefined) {
                    info += layer.b + " (external)" + "</div></div>"
                } else {
                    info += "Document" + "</div></div>"
                }

            }
            if (styleName != undefined) {
                info = "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Style" + "</div>" +
                    "<div class='value'>" + styleName + "</div>"
                if (layer.b != undefined) {
                    info += "<div style='font-size:12px; color:var(--color-secondary)'>" + layer.b + " (external)" + "</div></div>"
                } else {
                    info += "<div class='value'>" + "Document" + "</div></div>"
                }
            }


            if (comment != undefined) info +=
                "<hr>" +
                "<div class='block'>" +
                "<div class='label'>" + "Comment" + "</div>" +
                "<div style='value'>" + comment + "</div>" +
                "</div>"

            info += "<hr>" +
                "<div class='block twoColumn'>" +
                "<div>" +
                "<span class='label'>" + "X: </span>" + Math.round(frameX) + "px" +
                "</div>" +
                "<div>" +
                "<span class='label'>" + "Y: </span>" + Math.round(frameY) + "px" +
                "</div>" +
                "</div>"

            info += "<div class='block twoColumn'>" +
                "<div>" +
                "<span class='label'>" + "Width: </span>" + Math.round(frameWidth) + "px" +
                "</div>" +
                "<div>" +
                "<span class='label'>" + "Height: </span>" + Math.round(frameHeight) + "px" +
                "</div>" +
                "</div>"

            if (layer.t != undefined && layer.t != '') {
                info += "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Content" + "</div>" +
                    "<div class='value'>" + layer.t + "</div>" +
                    "</div>"
            }


            if (symInfo != undefined) {
                info += "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Symbol layers and tokens" + "</div>" +
                    "<div class='value code'>"
                var layerCounter = 0
                for (const layerName of Object.keys(symInfo.symbol.layers)) {
                    if (layerCounter) info += "<br/>"
                    info += layerName + "<br/>"
                    for (const tokenName of Object.keys(symInfo.symbol.layers[layerName].tokens)) {
                        info += sv._showTokenInfo(tokenName, layer)
                    }
                    layerCounter++
                }
                info += "</div></div>"
            }

            if (styleInfo != undefined) {
                info += "<hr>" +
                    "<div class='block'>" +
                    "<div class='label'>" + "Style tokens" + "</div>" +
                    "<div class='value code'>"
                for (const tokenName of Object.keys(styleInfo.style.tokens)) {
                    info += sv._showTokenInfo(tokenName, layer)
                }
                info += "</div></div>"
            }

            $('#symbol_viewer #empty').addClass("hidden")
            $("#symbol_viewer_content").html(info)
            //alert(info)
        })

        a.appendTo(currentPanel.linksDiv)

        var style = "left: " + l.x + "px; top:" + l.y + "px; "
        style += "width: " + l.w + "px; height:" + l.h + "px; "
        var symbolDiv = $("<div>", {
            class: "symbolDiv",
        }).attr('style', style)

        symbolDiv.appendTo(a)
    }

    _showTokenInfo(tokenName, layer) {
        let text = "<span class='tokenName'>" + tokenName + ";</span>"

        const libName = undefined != layer.b ? layer.b : story.docName
        const tokenValue = this._findTokenValueByName(tokenName, libName)
        if (undefined != tokenValue) {
            text += "<span class='tokenValue'>//" + tokenValue + "</span>"
        }

        return text + "<br/>"
    }

    _findTokenValueByName(tokenName, libName) {
        const lib = varsData[libName]
        if (undefined == lib) return undefined
        return lib[tokenName]
    }

    _findSymbolAndLibBySymbolName(symName) {
        for (const libName of Object.keys(symbolsData)) {
            const lib = symbolsData[libName]
            if (!(symName in lib)) continue
            return {
                lib: lib,
                libName: libName,
                symbol: lib[symName]
            }
        }
        return undefined
    }

    _findStyleAndLibByStyleName(styleName) {
        for (const libName of Object.keys(symbolsData)) {
            const lib = symbolsData[libName]
            if (!("styles" in lib) || !(styleName in lib.styles)) continue
            return {
                lib: lib,
                libName: libName,
                style: lib.styles[styleName]
            }
        }
        return undefined
    }
}
