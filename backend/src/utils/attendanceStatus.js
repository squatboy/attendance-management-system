// 출석 상태 코드 정의 및 변환 유틸리티
// 0: 미정(pending), 1: 출석(present), 2: 지각(late), 3: 결석(absent), 4: 공결(excused)

const STATUS_CODES = {
    PENDING: 0,
    PRESENT: 1,
    LATE: 2,
    ABSENT: 3,
    EXCUSED: 4
};

const STATUS_NAMES = {
    0: 'pending',
    1: 'present',
    2: 'late',
    3: 'absent',
    4: 'excused'
};

const STATUS_LABELS = {
    0: '미정',
    1: '출석',
    2: '지각',
    3: '결석',
    4: '공결'
};

// 문자열 상태를 코드로 변환
const statusToCode = (status) => {
    const upperStatus = status?.toUpperCase();
    return STATUS_CODES[upperStatus] !== undefined ? STATUS_CODES[upperStatus] : STATUS_CODES.ABSENT;
};

// 코드를 문자열 상태로 변환
const codeToStatus = (code) => {
    return STATUS_NAMES[code] || 'absent';
};

// 코드를 한글 라벨로 변환
const codeToLabel = (code) => {
    return STATUS_LABELS[code] || '결석';
};

// 상태 이름을 코드로 변환 (소문자 입력 지원)
const nameToCode = (name) => {
    const mapping = {
        'pending': 0,
        'present': 1,
        'late': 2,
        'absent': 3,
        'excused': 4
    };
    return mapping[name?.toLowerCase()] !== undefined ? mapping[name.toLowerCase()] : 3;
};

module.exports = {
    STATUS_CODES,
    STATUS_NAMES,
    STATUS_LABELS,
    statusToCode,
    codeToStatus,
    codeToLabel,
    nameToCode
};
