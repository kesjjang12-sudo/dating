# -*- coding: utf-8 -*-
"""
간단 그리드 매크로 (테스트용)
- 지정한 화면 영역(맵)을 격자로 나눠 골고루 돌아다니면서
- 각 지점에서 버튼(마우스 클릭 or 키보드 키)을 2번씩 눌러준다.

실행:  python macro.py
중지:  마우스를 화면 왼쪽 위 구석(0,0)으로 확 밀면 즉시 중단 (pyautogui failsafe)
필요:  pip install pyautogui
"""

import random
import sys
import time

import pyautogui

# ──────────────────── 설정 (여기만 고치면 됨) ────────────────────

# 맵 영역: (왼쪽 x, 위쪽 y, 너비, 높이). None이면 화면 전체를 사용.
# 예: REGION = (400, 200, 1100, 700)
REGION = None

# 격자 크기: 가로 COLS x 세로 ROWS 지점을 골고루 방문
ROWS = 4
COLS = 4

# 각 지점에서 할 동작: "click" 이면 마우스 클릭, 그 외엔 키보드 키 이름
# 키 이름 예: "space", "f", "enter", "1"  (pyautogui 키 이름 기준)
ACTION = "click"

# 지점마다 버튼을 누르는 횟수
PRESSES = 2

# 두 번 누름 사이 간격(초), 지점 간 이동 시간(초), 지점 도착 후 대기(초)
PRESS_INTERVAL = 0.15
MOVE_DURATION = 0.4
WAIT_AT_POINT = 0.3

# 전체 맵을 몇 바퀴 돌지 (0이면 무한 반복)
LOOPS = 1

# 시작 전 카운트다운(초) — 이 사이에 대상 창을 클릭해서 활성화해 둘 것
START_DELAY = 5

# ────────────────────────────────────────────────────────────────

pyautogui.FAILSAFE = True  # 마우스를 (0,0) 구석으로 밀면 예외로 즉시 중단
pyautogui.PAUSE = 0.05


def grid_points():
    """영역을 ROWS x COLS로 나눠 각 칸의 중심 좌표를 지그재그 순서로 돌려준다."""
    if REGION is None:
        w, h = pyautogui.size()
        left, top = 0, 0
    else:
        left, top, w, h = REGION

    cell_w = w / COLS
    cell_h = h / ROWS

    points = []
    for r in range(ROWS):
        cols = range(COLS) if r % 2 == 0 else range(COLS - 1, -1, -1)  # 지그재그
        for c in cols:
            x = int(left + cell_w * c + cell_w / 2)
            y = int(top + cell_h * r + cell_h / 2)
            points.append((x, y))
    return points


def press_at(x, y):
    pyautogui.moveTo(x, y, duration=MOVE_DURATION)
    time.sleep(WAIT_AT_POINT)
    for i in range(PRESSES):
        if ACTION == "click":
            pyautogui.click()
        else:
            pyautogui.press(ACTION)
        if i < PRESSES - 1:
            time.sleep(PRESS_INTERVAL + random.uniform(0, 0.05))


def main():
    points = grid_points()
    print(f"{ROWS}x{COLS} = {len(points)}개 지점, 동작={ACTION} x{PRESSES}회, 반복={LOOPS or '무한'}")
    for s in range(START_DELAY, 0, -1):
        print(f"  {s}초 후 시작... (대상 창을 활성화해 두세요)")
        time.sleep(1)

    lap = 0
    try:
        while True:
            lap += 1
            for i, (x, y) in enumerate(points, 1):
                press_at(x, y)
                print(f"  [{lap}바퀴 {i}/{len(points)}] ({x}, {y}) 완료")
            if LOOPS and lap >= LOOPS:
                break
        print("끝!")
    except pyautogui.FailSafeException:
        print("중단됨 (failsafe: 마우스가 화면 구석으로 이동)")
        sys.exit(1)


if __name__ == "__main__":
    main()
