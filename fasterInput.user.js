/*
 * @Author: Quentin Luo
 * @Date: 2022-08-12 23:25:42
 * @LastEditTime: 2022-09-04 13:35:49
 * @LastEditors: Quentin Luo
 * @Description:
 * Life was like a box of chocolates, you never know what you're gonna get.
 */

// ==UserScript==
// @name              快速输入客观题答案
// @version           0.1
// @author            Quentin Luo
// @description       智能识别选中剪切板中的答案，按字符分割并填入输入框
// @license           AGPL-3.0-or-later
// @match             https://eduapp.runjian.com/region/exam/single/answer/*
// @require           https://unpkg.com/sweetalert2@10.16.6/dist/sweetalert2.min.js
// @require           https://unpkg.com/hotkeys-js/dist/hotkeys.min.js
// @resource          swalStyle https://unpkg.com/sweetalert2@10.16.6/dist/sweetalert2.min.css
// @updateURL         https://github.com/ghplvh/littleUtils/fasterInput.user.js
// @downloadURL       https://github.com/ghplvh/littleUtils/fasterInput.user.js
// @run-at            document-idle
// @grant             GM_openInTab
// @grant             GM_setValue
// @grant             GM_getValue
// @grant             GM_registerMenuCommand
// @grant             GM_getResourceText
// @grant             GM_addStyle
// @grant             GM_cookie
// ==/UserScript==

(function () {
    "use strict";
    const customClass = {
        container: "searchbox-container",
        popup: "searchbox-popup",
    };

    let style = ".swal2-container {z-index: 9000000 !important}"
    GM_addStyle(style)

    let toast = Swal.mixin({
        toast: true,
        position: 'top',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: false,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    let util = {
        getValue(name) {
            return GM_getValue(name);
        },

        setValue(name, value) {
            GM_setValue(name, value);
        },

        sleep(time) {
            return new Promise((resolve) => setTimeout(resolve, time));
        },

        addStyle(id, tag, css) {
            tag = tag || 'style';
            let doc = document, styleDom = doc.getElementById(id);
            if (styleDom) return;
            let style = doc.createElement(tag);
            style.rel = 'stylesheet';
            style.id = id;
            tag === 'style' ? style.innerHTML = css : style.href = css;
            document.head.appendChild(style);
        }
    };

    let main = {
        addHotKey() {
            hotkeys("f2", (event, handler) => {
                event.preventDefault();
                this.showIdentifyBox();
            });
        },

        // 添加状态
        addStaus(error, success) {
            if (error.length > 0) {
                var ul = $("<ul>")
                error.forEach(e => {
                    ul.append("<li>" + e + "</li>")
                })
                Swal.fire({
                    icon: "error",
                    title: '未检索到以下用户',
                    html: ul,

                })
            }
            else {
                toast.fire({
                    icon: "success",
                    title: '成功检索到' + success.length + "个用户",
                })
            }

        },

        filterStr(str) {
            var pattern = new RegExp("[^A-Za-z\?]");
            var specialStr = "";
            for (var i = 0; i < str.length; i++) {
                specialStr += str.substr(i, 1).replace(pattern, '');
            }
            return specialStr;
        },


        setAnswer(inputanswers) {
            const inputElements = document.querySelectorAll('div.answer.answer-font input[style="border: 1px solid rgb(248, 142, 5);"]')
            // var $answers = $('div.answer.answer-font input[style="border: 1px solid rgb(248, 142, 5);"]');
            var length = inputElements.length;
            var answers = this.filterStr(inputanswers.replace(/\s/g, ""));

            if (answers != "") {
                if (answers.length > length) {
                    toast.fire({
                        icon: "error",
                        title: '您录入的答案超过了题目数量，请您核对后再录入吧',
                    })
                } else {
                    for (var i = 0; i < length; i++) {
                        inputElements[i].value = answers.charAt(i);
                        const inputEvent = new Event('input', {
                            bubbles: true,
                            cancelable: true,
                        });
                        inputElements[i].dispatchEvent(inputEvent);

                    }
                }
            } else {
                toast.fire({
                    icon: "error",
                    title: '批量录入之前请您输入答案',
                })
            };

        },

        //识别输入框中的内容
        showIdentifyBox() {
            var arr = [];
            var $answers = $('div.answer.answer-font input[style="border: 1px solid rgb(248, 142, 5);"]');
            var length = $answers.length;
            for (var i = 0; i < length; i++) {
                arr.push($answers.get(i).value)
            }
            var str1 = arr.join("");
            Swal.fire({
                title: "识别剪切板中文字",
                input: "textarea",
                inputPlaceholder: "若选方式一，请按 Ctrl+V 粘贴要识别的文字",
                html: `<div style="font-size: 12px;color: #999;margin-bottom: 8px;text-align: center;">提示：在任意网页按下 <span style="font-weight: 700;">F2</span> 键可快速打开本窗口。</div><div style="font-size: 5px;line-height: 22px;padding: 10px 0 5px;text-align: left;"><div style="font-size: 16px;margin-bottom: 8px;font-weight: 700;">支持以下两种方式：</div><div><b>方式一：</b>直接粘贴文字到输入框，点击“识别方框内容”按钮。</div><div><b>方式二：</b>点击“读取剪切板”按钮。<span style="color: #d14529;font-size: 12px;">会弹出“授予网站读取剪切板”权限，同意后会自动识别剪切板中的文字。</span></div></div>`,
                showCloseButton: false,
                showDenyButton: true,
                confirmButtonText: "识别方框内容",
                denyButtonText: "读取剪切板",
                customClass,
                inputValue: str1
            }).then((res) => {
                if (res.isConfirmed) {
                    this.setAnswer(res.value)
                    console.log(res.value)
                }
                if (res.isDenied) {
                    navigator.clipboard.readText().then(text => {
                        this.setAnswer(res.value)
                        console.log(res.value)
                    }).catch((e) => {
                        toast.fire({
                            title: "读取剪切板失败，请先授权或手动粘贴后识别！",
                            icon: "error",
                            text: e
                        });
                    });
                }
            });
        },


        registerMenuCommand() {
            GM_registerMenuCommand("📋️ 识别剪切板中文字（快捷键 F2）", () => {
                this.showIdentifyBox();
            });
        },

        addPluginStyle() {
            let style = `
                .searchbox-container { z-index: 99999999!important }
                .searchbox-popup { font-size: 14px !important }
                .searchbox-setting-label { display: flex;align-items: center;justify-content: space-between;padding-top: 20px; }
                .searchbox-setting-checkbox { width: 16px;height: 16px; }
            `;

            if (document.head) {
                util.addStyle('swal-pub-style', 'style', GM_getResourceText('swalStyle'));
                util.addStyle('searchbox-style', 'style', style);
            }

            const headObserver = new MutationObserver(() => {
                util.addStyle('swal-pub-style', 'style', GM_getResourceText('swalStyle'));
                util.addStyle('searchbox-style', 'style', style);
            });
            headObserver.observe(document.head, { childList: true, subtree: true });
        },

        addButton() {
            // 新增一个按钮， 放在bottom-tool class下面
            var button = document.createElement("button");
            button.innerHTML = "批量输入答案";
            button.setAttribute("class", "el-button el-button--primary el-button--small");
            button.setAttribute("style", "margin-left: 10px;");
            button.onclick = function () {
                main.showIdentifyBox();
            };

            $(document).ready(function () {
                let ready = setInterval(function () {
                    clearInterval(ready);
                    if ($(".sub-header")[1]) {
                        $(".sub-header")[1].append(button);
                    }
                }, 800);
            })
        },

        init() {
            this.addPluginStyle();
            this.addHotKey();
            this.registerMenuCommand();
            this.addButton()
        },
    };

    main.init();
})();
