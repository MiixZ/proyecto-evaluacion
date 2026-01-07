/* eslint-disable @typescript-eslint/no-explicit-any */
import api from "@/lib/api";
import { GroupStudentDTO } from "@/types/dashboard.types";

interface AddStudentData {
  firstName: string;
  lastName: string;
  email: string;
}

interface UpdateStudentData {
  firstName: string;
  lastName: string;
  email: string;
}

export interface GroupDetails extends Record<string, unknown> {
  id: string;
  courseId: string;
  name: string;
  description: string | null;
  capacity: number | null;
  status: string;
}

export const groupService = {
  getById: async (groupId: string): Promise<GroupDetails> => {
    const { data } = await api.get<{ data: GroupDetails }>(
      `/v1/groups/${groupId}`
    );

    return data.data;
  },

  getBySubjectAndYear: async (subjectId: string, academicYear: string) => {
    const { data } = await api.get(`/v1/groups/search/context`, {
      params: { subjectId, academicYear },
    });

    return data.data;
  },

  listByCourse: async (courseId: string) => {
    const { data } = await api.get(`/v1/groups/course/${courseId}`);

    return data.data;
  },

  createGroup: async (payload: {
    courseId: string;
    name: string;
    description?: string;
    capacity?: number | null;
    status?: string;
  }) => {
    const { data } = await api.post(`/v1/groups`, payload);

    return data.data;
  },

  updateGroup: async (id: string, payload: any) => {
    const { data } = await api.patch(`/v1/groups/${id}`, payload);

    return data.data;
  },

  getGroupStudents: async (groupId: string): Promise<GroupStudentDTO[]> => {
    if (!groupId) return Promise.resolve([]);
    const { data } = await api.get(`/v1/groups/${groupId}/students`);

    return data.data;
  },

  addStudent: async (groupId: string, student: AddStudentData) => {
    const { data } = await api.post(`/v1/groups/${groupId}/students`, student);

    return data;
  },

  importStudentsCsv: async (groupId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/v1/groups/${groupId}/students/import`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return data;
  },

  removeStudent: async (groupId: string, studentId: string) => {
    const { data } = await api.delete(
      `/v1/groups/${groupId}/students/${studentId}`
    );

    return data;
  },

  updateStudent: async (
    groupId: string,
    studentId: string,
    student: UpdateStudentData
  ) => {
    const { data } = await api.put(
      `/v1/groups/${groupId}/students/${studentId}`,
      student
    );
    return data;
  },

  toggleStudentStatus: async (groupId: string, studentId: string) => {
    const { data } = await api.patch(
      `/v1/groups/${groupId}/students/${studentId}/status`
    );

    return data;
  },
};
