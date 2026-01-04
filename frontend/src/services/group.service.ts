import api from "@/lib/api";
import { GroupStudentDTO } from "@/types/dashboard.types";

interface AddStudentData {
  firstName: string;
  lastName: string;
  email: string;
}

export const groupService = {
  getGroupStudents: async (groupId: string): Promise<GroupStudentDTO[]> => {
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
};
