// 출석 상태 코드 정의 및 변환 유틸리티
// 0: 미정(pending), 1: 출석(present), 2: 지각(late), 3: 결석(absent), 4: 공결(excused)

export const STATUS_CODES = {
    PENDING: 0,
    PRESENT: 1,
    LATE: 2,
    ABSENT: 3,
    EXCUSED: 4
}

export const STATUS_LABELS = {
    0: '미정',
    1: '출석',
    2: '지각',
    3: '결석',
    4: '공결'
}

export const STATUS_COLORS = {
    0: 'gray',    // 미정
    1: 'green',   // 출석
    2: 'yellow',  // 지각
    3: 'red',     // 결석
    4: 'blue'     // 공결
}

export const STATUS_CLASSES = {
    0: 'bg-gray-100 text-gray-800',      // 미정
    1: 'bg-green-100 text-green-800',    // 출석
    2: 'bg-yellow-100 text-yellow-800',  // 지각
    3: 'bg-red-100 text-red-800',        // 결석
    4: 'bg-blue-100 text-blue-800'       // 공결
}

// 코드를 라벨로 변환
export function codeToLabel(code) {
    return STATUS_LABELS[code] || '알수없음'
}

// 코드를 색상으로 변환
export function codeToColor(code) {
    return STATUS_COLORS[code] || 'gray'
}

// 코드를 CSS 클래스로 변환
export function codeToClass(code) {
    return STATUS_CLASSES[code] || 'bg-gray-100 text-gray-800'
}

// 라벨을 코드로 변환 (사용자 입력용)
export function labelToCode(label) {
    const labelMap = {
        '미정': 0,
        '출석': 1,
        '지각': 2,
        '결석': 3,
        '공결': 4
    }
    return labelMap[label] !== undefined ? labelMap[label] : 3
}

// 모든 상태 목록 (선택 옵션용)
export const ALL_STATUSES = [
    { code: 0, label: '미정' },
    { code: 1, label: '출석' },
    { code: 2, label: '지각' },
    { code: 3, label: '결석' },
    { code: 4, label: '공결' }
]

// 이의제기 가능한 상태 (결석 제외)
export const APPEAL_STATUSES = [
    { code: 0, label: '미정' },
    { code: 1, label: '출석' },
    { code: 2, label: '지각' },
    { code: 4, label: '공결' }
]
