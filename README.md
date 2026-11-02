# 锦安老师的公开课

「跟锦安读一句」面向一至九年级的语文阅读与表达，另设文史拓展。首课是四年级《题西林壁》。也可以从书架依次选择科目、年级和单元，例如“语文 → 七年级 → 上册 · 第二单元”进入《咏雪》。[打开公开课堂](https://fengxy0725.github.io/jinan-classroom/)

首页页脚可以预览、下载宣传海报。把海报发到班级群，或按 A4 纵向打印，学生扫描图上的二维码即可进入公开首页。[查看宣传海报](./assets/classroom-poster.png)

## 课程与互动

初版课程库收录了 184 节课和 371 道带解析的随堂题。其中 169 节初中语文讲义根据 233 份课件编写，其余 15 节为小学语文、历史启蒙和初中历史示范课。在线书架的数量随教师发布、更新或撤下课程而变化。

| 年级 | 上册讲义 | 下册讲义 | 纳入的语文课件 |
| --- | ---: | ---: | ---: |
| 七年级 | 26 | 35 | 107 份 |
| 八年级 | 19 | 41 | 68 份 |
| 九年级 | 21 | 27 | 58 份 |

同一篇目的多个课时可以在讲义内展开。写作、名著和复习课按实际专题编目。原始 PPT、PPTX 保存在教师自己的资料目录。

学生可以先作答，再对照解析重新练习。“合上讲义 · 回忆卡”支持先写或口述解释、翻开讲解、自评掌握程度，难点会回到队尾。学生的草稿与答案只在当前页面使用。

## 教师管理课程

从课堂首页打开“教师入口”，点击“登录 GitHub 管理课程”，使用有仓库写入权限的账号进入 `courses` 目录。每个分组对应一个文件。打开文件后，通过右上角的铅笔修改已有课、增加新课、下架课程或附上视频链接。提交到 `main` 分支并等 Pages 发布成功后，改动就会出现在学生课堂。[教师入口](https://fengxy0725.github.io/jinan-classroom/teacher/) · [教师操作指南](./teacher/README.md) · [课程目录](./courses/)

这个仓库公开保存已发布的课程文件及其提交历史。未发布的草稿、学生名单和访客记录请保存在私有位置。

## 在电脑上试用

在项目文件夹里打开终端，运行以下命令，让浏览器通过 HTTP 读取课程文件。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

用浏览器打开本机预览，选择课程，检查讲义、探究活动和随堂题。按 `Ctrl+C` 结束预览。[本机预览](http://127.0.0.1:8000/)

## 网站文件

| 文件 | 用途 |
| --- | --- |
| `index.html`、`app.js` | 首页、课程目录和搜索 |
| `courses/*.json` | 按科目、年级分组的已发布课程 |
| `catalog.js` | 读取课程目录，供首页和讲义使用 |
| `lesson.html`、`lesson.js`、`lesson.css` | 互动讲义、课堂视频和练习 |
| `teacher/` | 教师登录入口及课程操作指南 |
| `assets/` | 网页图标、插画、宣传海报与课程封面 |

## GitHub Pages 发布

本项目从公开仓库 `fengxy0725/jinan-classroom` 的 `main` 分支根目录发布。仓库管理员可以在 **Settings → Pages → Build and deployment** 选择 **Deploy from a branch**，设置分支为 **main**，目录为 **/(root)**。修改合入 `main` 后，到 **Actions** 查看 Pages 发布任务；成功后，刷新公开课堂检查改动。[发布记录](https://github.com/fengxy0725/jinan-classroom/actions) · [GitHub 官方分支发布说明](https://docs.github.com/zh/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
