# CR-004 新 ChatGPT Site 部署计划 — 2026-11-08

## 目标

- 源码仓库：`jaronhoh/margin-share-calculator`
- 源码分支：`feat/cr-004-ui-cleanup`
- 产品范围：完整 Worker 应用（Version 69 基线 + CR-004），包括现有回测、股息、Worker API、数据和快照功能。
- 新 Site 标题与 slug：`margin-share-calculator`
- 访问：新 Site 默认 Owner-only；不新增访客、群组或编辑者。
- 不创建测试探针或空白应用；不重新开启 PR #3；不改动其他 Site。

## 部署前检查

- [x] 指定分支 HEAD 与完整应用源码核对；CR-004 修改覆盖 PRD 中四项 UI 要求。
- [x] `npm test`：43 项通过，0 失败。
- [x] `npm run build`：Worker 构建成功，打包 19 个静态资源。
- [x] Chromium：`yahoo-calendar-ui.cjs` 与 `dividend-single-table-ui.cjs` 通过。覆盖 1440、390、320 CSS px、亮/暗主题、页面溢出、日期布局、四项 CR-004 UI、样例回测、数据快照、股息页面、24 条默认记录及 Footer 版本。
- [x] 修复浏览器测试脚本写死旧 Mac 路径的问题，改为使用本机 Playwright 解析和可选 `CHROMIUM_PATH`。

## 发布步骤

1. 创建标题/slug 为 `margin-share-calculator` 的新 Site，确认 Owner-only 默认访问策略。
2. 将创建返回的 opaque project ID 写入 `site-source/.openai/hosting.json`，不沿用被删除 Site 的旧 ID。
3. 将这次 PRD、部署计划和测试运行器修复提交并推送到指定 GitHub 分支；Site 发布使用与该 commit 一致的 Worker 构建产物。
4. 对最终打包源状态重新运行 Node、Worker 和 Chromium/响应式检查，再使用 Sites 原生私有部署流程发布完整 Worker 应用。
5. 核对部署状态、URL、Sites 版本与 deployment ID；读取访问策略确认 Owner-only。
6. 在线执行 MAYBANK 回测和股息页检查；核对四项 CR-004 UI、Spark Finance 目标链接、Footer 版本及移动端无横向溢出。

## 发布后记录

部署前保持 `PENDING`。发布后仅记录 Sites 工具返回并实际验证的 Site URL、版本号、deployment ID、源 GitHub commit SHA、Owner-only 访问策略和线上检查结果；GitHub 提交、部署成功及线上验证分别记录，不相互替代。
