import { describe, it, expect } from 'vitest'
import { searchRooms, searchFaculty } from '@/lib/search'
import { parseCSVRow, toCSV } from '@/lib/utils'
import type { RoomWithStatus, Building, Department, FacultyMember } from '@/types'

const mockBuildings: Building[] = [
  { id: 'b1', name: 'Academic Building A', shortName: 'AB-A', floors: 5, isActive: true },
  { id: 'b2', name: 'Science Complex', shortName: 'SC', floors: 4, isActive: true },
]

const mockDepartments: Department[] = [
  { id: 'dept-cse', name: 'Computer Science & Engineering', shortName: 'CSE', isActive: true },
  { id: 'dept-eee', name: 'Electrical Engineering', shortName: 'EEE', isActive: true },
]

const mockRooms: RoomWithStatus[] = [
  {
    id: 'r1',
    number: '302',
    name: 'Classroom 302',
    category: 'classroom',
    buildingId: 'b1',
    floor: 3,
    departmentId: 'dept-cse',
    facilities: ['Projector', 'AC'],
    isActive: true,
    isTemporaryClosed: false,
    scheduleVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    currentStatus: 'available',
    todaySchedules: [],
  },
  {
    id: 'r2',
    number: 'B-101',
    name: 'Computer Lab 1',
    category: 'computer_lab',
    buildingId: 'b2',
    floor: 1,
    departmentId: 'dept-cse',
    facilities: ['Workstations', 'AC', 'WiFi'],
    isActive: true,
    isTemporaryClosed: false,
    scheduleVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    currentStatus: 'occupied',
    todaySchedules: [],
  },
  {
    id: 'r3',
    number: 'A-315',
    name: "Chairman's Office — CSE",
    category: 'chairman_office',
    buildingId: 'b1',
    floor: 3,
    departmentId: 'dept-cse',
    facilities: ['AC'],
    isActive: true,
    isTemporaryClosed: false,
    scheduleVerified: true,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    currentStatus: 'available',
    todaySchedules: [],
  },
]

describe('Search Engine', () => {
  it('Searches room by exact number', () => {
    const res = searchRooms(mockRooms, { query: '302' }, mockBuildings, mockDepartments)
    expect(res.length).toBe(1)
    expect(res[0].number).toBe('302')
  })

  it('Searches room by category intent alias ("computer lab")', () => {
    const res = searchRooms(mockRooms, { query: 'computer lab' }, mockBuildings, mockDepartments)
    expect(res.length).toBe(1)
    expect(res[0].name).toBe('Computer Lab 1')
  })

  it('Searches room by Chairman intent', () => {
    const res = searchRooms(mockRooms, { query: 'Chairman' }, mockBuildings, mockDepartments)
    expect(res.length).toBe(1)
    expect(res[0].name).toContain('Chairman')
  })

  it('Filters by building', () => {
    const res = searchRooms(mockRooms, { query: '', buildingId: 'b2' }, mockBuildings, mockDepartments)
    expect(res.length).toBe(1)
    expect(res[0].id).toBe('r2')
  })

  it('Filters by status', () => {
    const res = searchRooms(mockRooms, { query: '', status: ['occupied'] }, mockBuildings, mockDepartments)
    expect(res.length).toBe(1)
    expect(res[0].currentStatus).toBe('occupied')
  })

  it('Searches faculty by name and office room', () => {
    const mockFaculty: FacultyMember[] = [
      {
        id: 'f1',
        name: 'Dr. Rahim Ahmed',
        title: 'Dr.',
        designation: 'Professor & Chairman',
        officeRoomId: 'r3',
        contactPublished: true,
        isActive: true,
      },
      {
        id: 'f2',
        name: 'Ms. Fatema Akter',
        title: 'Ms.',
        designation: 'Lecturer',
        officeRoomId: 'r1',
        contactPublished: true,
        isActive: true,
      },
    ]

    const found = searchFaculty(mockFaculty, 'Rahim', mockRooms)
    expect(found.length).toBe(1)
    expect(found[0].name).toBe('Dr. Rahim Ahmed')

    // Find by office room number
    const foundByRoom = searchFaculty(mockFaculty, '302', mockRooms)
    expect(foundByRoom.length).toBe(1)
    expect(foundByRoom[0].name).toBe('Ms. Fatema Akter')
  })
})

describe('CSV Utilities', () => {
  it('Parses standard CSV row', () => {
    const row = '101,Classroom 101,classroom,b1,1'
    const parsed = parseCSVRow(row)
    expect(parsed).toEqual(['101', 'Classroom 101', 'classroom', 'b1', '1'])
  })

  it('Parses quoted CSV row with commas inside quotes', () => {
    const row = '101,"Classroom 101, West Wing",classroom,b1,"AC, Projector, WiFi"'
    const parsed = parseCSVRow(row)
    expect(parsed).toEqual(['101', 'Classroom 101, West Wing', 'classroom', 'b1', 'AC, Projector, WiFi'])
  })

  it('Exports array of rows to valid CSV string', () => {
    const headers = ['Number', 'Name', 'Category']
    const rows = [
      ['101', 'Room 101', 'classroom'],
      ['102', 'Room 102, Main', 'classroom'],
    ]
    const csv = toCSV(headers, rows)
    expect(csv).toContain('Number,Name,Category')
    expect(csv).toContain('"Room 102, Main"')
  })
})
