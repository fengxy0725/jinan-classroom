# 教师操作指南

第一次使用时，从教师入口点击 **登录 GitHub 管理课程**，用有仓库写入权限的 GitHub 账号登录。登录后会打开课程目录。如果已登录，可以直接打开以下分组。手机上如看不到铅笔，可在文件右上角的 **…** 菜单中找 **Edit file**。[教师入口](https://fengxy0725.github.io/jinan-classroom/teacher/) · [GitHub 课程目录](https://github.com/fengxy0725/jinan-classroom/tree/main/courses)

| 课程分组 | 打开文件 |
| --- | --- |
| 小学语文 | [primary-chinese.json](../courses/primary-chinese.json) |
| 小学历史启蒙 | [primary-history.json](../courses/primary-history.json) |
| 七年级语文 | [grade7.json](../courses/grade7.json) |
| 八年级语文 | [grade8.json](../courses/grade8.json) |
| 九年级语文 | [grade9.json](../courses/grade9.json) |
| 初中历史 | [junior-history.json](../courses/junior-history.json) |

## 修改讲义

1. 选择上表中的一个分组。打开文件后，点击铅笔 **Edit file**。用浏览器的“在页面中查找”，搜索课名。
2. 先试改一句文字。例如，找到该课的 `"warmup"`，它后面双引号内的文字会出现在讲义的“课前一问”。把引号内的文字换成自己的提问，保留引号、冒号和逗号。
3. 点击 **Commit changes…**（提交更改），在提交说明中写清改了什么，例如“修改《春》的课前一问”。选择直接提交到 `main`，再点一次 **Commit changes**。若仓库要求审阅，选择新分支并创建 **Pull request**，由有权限的账号合入 `main`。
4. 等仓库 **Actions** 中本次 Pages 发布成功，刷新公开课堂。按科目、年级和单元找到该课，核对讲义、选项和解析。[发布记录](https://github.com/fengxy0725/jinan-classroom/actions) · [打开课堂](https://fengxy0725.github.io/jinan-classroom/)

若 GitHub 提示 **Fork**，当前账号不能直接修改这个仓库。检查右上角头像，切换到有写入权限的账号，或请仓库所有者授予权限。

## 新增一节课

1. 打开对应分组的文件，点击铅笔。一个分组文件是一个列表，开头是 `[`，末尾是 `]`。每节课是一段完整的 `{ … }`。
2. 到文件末尾，在最后一节课的右花括号 `}` 后加一个英文逗号，再换行，粘贴下方的完整示例。文件末尾原有的 `]` 留在新课之后。若分组为空 `[]`，把示例粘在两个方括号之间即可。
3. 将 `id` 改成全站独一无二的课程编号，建议使用小写字母、数字和短横线，如 `g2-du-dongci`。发布后保留此编号，之前分享的课程链接才能继续打开。按实际课程替换标题、年级、单元和练习，再按上面的步骤提交和检查。

```json
{
  "id": "g2-du-dongci",
  "title": "读动词，想画面",
  "grade": 2,
  "subject": "语文",
  "term": "拓展",
  "unit": "拓展 · 动词与画面",
  "type": "示范课",
  "genre": "词句练习",
  "summary": "从三个动词里，看见小猫回家的动作。",
  "warmup": "小猫“走”上窗台和“跃”上窗台，你会怎样用手演给同桌看？",
  "focus": [
    { "label": "读句子", "text": "小猫跃上窗台，蹭了蹭花盆，蜷成一个毛团。找出三个描写动作的词。" }
  ],
  "activity": {
    "prompt": "选一个词，用手演出来，再打开提示。",
    "choices": [
      { "label": "跃", "text": "手掌轻轻向上一跳，再落到桌面。哪一瞬间手离开了桌面？" },
      { "label": "蜷", "text": "将张开的手指慢慢收拢，想一想小猫的身体会变成什么形状。" }
    ]
  },
  "quiz": [
    {
      "question": "哪个词写小猫跳上窗台？",
      "options": ["蜷", "跃", "蹭"],
      "answer": 1,
      "explanation": "“跃”写小猫身子腾起，表现出跳的动作。"
    },
    {
      "question": "小猫最后是什么样子？",
      "options": ["身体缩成一团", "正向上跳", "正在推花盆"],
      "answer": 0,
      "explanation": "“蜷”写身体弯曲收拢，“毛团”写出它蜷好后的模样。"
    }
  ]
}
```

`grade` 填年级数字 1 至 9，`subject` 填“语文”或“历史”。`term` 和 `unit` 请与同单元的其他课写法一致。`quiz` 中的 `answer` 从 0 开始计数，0 对应第一项，1 对应第二项。JSON 格式使用英文双引号，最后一项后不加逗号。

## 下架一节课

搜索课名，核对 `id`，删除该课从左花括号到对应右花括号的完整内容。相邻两节课之间只保留一个英文逗号，第一项之前和最后一项之后都没有逗号。如果删掉分组中的唯一一节课，文件内容保留 `[]`。提交、发布后，检查学生目录和原课程链接。下架会从学生课堂移除课程，先前公开的版本仍可在 GitHub 提交历史中查到。

## 给课程添加视频

**把短视频放在同一仓库。** 给可公开播放的 MP4 视频取一个便于输入的英文文件名，例如 `reading.mp4`，建议压缩到小于 25 MiB。GitHub 浏览器上传的单文件上限是 25 MiB。登录后打开下方的上传入口，选中视频，提交到 `main`。文件会保存在仓库的 `videos` 目录。[在 GitHub 上传教学短片](https://github.com/fengxy0725/jinan-classroom/upload/main/videos) · [GitHub 上传说明](https://docs.github.com/zh/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)

打开对应课程文件，在 `"warmup"` 一行前插入以下片段。将 `url` 的文件名改成和已上传文件完全相同，`title` 填视频标题。`transcript` 是可选的文字稿；没有文字稿时可以删掉这一行及前一行末尾的逗号。提交并等待发布，再打开学生课堂试播。

```json
"video": {
  "url": "./videos/reading.mp4",
  "title": "读动词，想画面",
  "transcript": "先读一遍原句，听一听“跃”字该怎样读。"
},
```

**使用已有的长视频。** 若视频已经有学生无需登录即可播放的 HTTPS 文件直链，可以把示例中的 `./videos/reading.mp4` 换成该链接。先在浏览器无痕窗口试播，再保存课程。视频平台的观看页和网盘预览页不能直接填入播放器。

## 公开与私有资料

本仓库中的文件和历史版本任何人都可以读取。公开课件和公开视频可以进入仓库。未公开的讲义、学生名单、个人信息和访客记录请留在教师自己的私有位置。学生打开公开课堂无需登录。
