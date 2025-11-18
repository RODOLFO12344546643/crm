import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import {User} from '../models/users.model';
import {Tec} from '../models/tecs.model';
import {Career} from '../models/career.model';

export interface DatabaseStructure {
  usuarios: User[];
  instituciones: Tec[];
  currentUser: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class JsonStorageService {
  private readonly JSON_PATH = 'assets/data/database.json';
  private dataSubject = new BehaviorSubject<DatabaseStructure>({
    usuarios: [],
    instituciones: [],
    currentUser: null
  });

  public data$ = this.dataSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadData();
  }


  private async loadData(): Promise<void> {
    try {
      const data = await firstValueFrom(
        this.http.get<DatabaseStructure>(this.JSON_PATH)
      );
      this.dataSubject.next(data);
    } catch (error) {
      console.error('Error cargando datos:', error);
      // Inicializar con estructura vacía si falla
      this.dataSubject.next({
        usuarios: [],
        instituciones: [],
        currentUser: null
      });
    }
  }

  /**
   * IMPORTANTE: Este método simula guardar datos.
   * En desarrollo, los cambios solo persisten en memoria durante la sesión.
   * Para persistencia real, necesitas un backend.
   */
  private saveData(): void {
    const data = this.dataSubject.value;
    console.log('Datos actualizados (solo en memoria):', data);

    // Para desarrollo: guardar en localStorage como respaldo
    localStorage.setItem('app_backup', JSON.stringify(data));

    // TODO: Implementar llamada a API backend para guardar permanentemente
    // this.http.post('/api/save', data).subscribe();
  }

  getAllUsers(): User[] {
    return this.dataSubject.value.usuarios;
  }

  getUserByCorreo(correo: string): User | undefined {
    return this.dataSubject.value.usuarios.find(u => u.correo === correo);
  }

  addUser(user: Omit<User, 'id'>): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;

    if (currentData.usuarios.some(u => u.correo === user.correo)) {
      return { success: false, message: 'Correo ya registrado' };
    }

    const newUser: User = {
      id: Date.now(),
      ...user
    };

    const updatedData = {
      ...currentData,
      usuarios: [...currentData.usuarios, newUser]
    };

    this.dataSubject.next(updatedData);
    this.saveData();

    return { success: true, message: 'Usuario registrado exitosamente' };
  }

  validateCredentials(correo: string, password: string): User | null {
    const user = this.getUserByCorreo(correo);
    if (user && user.password === password) return user;
    return null;
  }

  updateUser(id: number, updates: Partial<User>): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;
    const index = currentData.usuarios.findIndex(u => u.id === id);

    if (index === -1) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const updatedUsers = [...currentData.usuarios];
    updatedUsers[index] = { ...updatedUsers[index], ...updates };

    this.dataSubject.next({
      ...currentData,
      usuarios: updatedUsers
    });
    this.saveData();

    return { success: true, message: 'Usuario actualizado' };
  }

  deleteUser(id: number): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;

    this.dataSubject.next({
      ...currentData,
      usuarios: currentData.usuarios.filter(u => u.id !== id)
    });
    this.saveData();

    return { success: true, message: 'Usuario eliminado' };
  }

  // ==================== INSTITUCIONES ====================

  getAllTecs(): Tec[] {
    return this.dataSubject.value.instituciones;
  }

  getTecById(id: number): Tec | undefined {
    return this.dataSubject.value.instituciones.find(t => t.id === id);
  }

  getTecByCCT(cct: number): Tec | undefined {
    return this.dataSubject.value.instituciones.find(t => t.CCT === cct);
  }

  addTec(tec: Omit<Tec, 'id' | 'carreras'>): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;

    if (currentData.instituciones.some(t => t.CCT === tec.CCT)) {
      return { success: false, message: 'CCT ya registrado' };
    }

    const newTec: Tec = {
      id: Date.now(),
      ...tec,
      carreras: []
    };

    const updatedData = {
      ...currentData,
      instituciones: [...currentData.instituciones, newTec]
    };

    this.dataSubject.next(updatedData);
    this.saveData();

    return { success: true, message: 'Institución registrada exitosamente' };
  }

  updateTec(id: number, updates: Partial<Tec>): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;
    const index = currentData.instituciones.findIndex(t => t.id === id);

    if (index === -1) {
      return { success: false, message: 'Institución no encontrada' };
    }

    const updatedInstituciones = [...currentData.instituciones];
    updatedInstituciones[index] = { ...updatedInstituciones[index], ...updates };

    this.dataSubject.next({
      ...currentData,
      instituciones: updatedInstituciones
    });
    this.saveData();

    return { success: true, message: 'Institución actualizada' };
  }

  deleteTec(id: number): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;

    this.dataSubject.next({
      ...currentData,
      instituciones: currentData.instituciones.filter(t => t.id !== id)
    });
    this.saveData();

    return { success: true, message: 'Institución eliminada' };
  }

  // ==================== CARRERAS ====================

  addCareerToTec(tecId: number, career: Omit<Career, 'id'>): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;
    const tecIndex = currentData.instituciones.findIndex(t => t.id === tecId);

    if (tecIndex === -1) {
      return { success: false, message: 'Institución no encontrada' };
    }

    const tec = currentData.instituciones[tecIndex];

    if (tec.carreras.some(c => c.clave === career.clave)) {
      return { success: false, message: 'Clave de carrera ya existe' };
    }

    const newCareer: Career = {
      id: Date.now(),
      ...career
    };

    const updatedInstituciones = [...currentData.instituciones];
    updatedInstituciones[tecIndex] = {
      ...tec,
      carreras: [...tec.carreras, newCareer]
    };

    this.dataSubject.next({
      ...currentData,
      instituciones: updatedInstituciones
    });
    this.saveData();

    return { success: true, message: 'Carrera agregada exitosamente' };
  }

  updateCareer(tecId: number, careerId: number, updates: Partial<Career>): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;
    const tecIndex = currentData.instituciones.findIndex(t => t.id === tecId);

    if (tecIndex === -1) {
      return { success: false, message: 'Institución no encontrada' };
    }

    const tec = currentData.instituciones[tecIndex];
    const careerIndex = tec.carreras.findIndex(c => c.id === careerId);

    if (careerIndex === -1) {
      return { success: false, message: 'Carrera no encontrada' };
    }

    const updatedCarreras = [...tec.carreras];
    updatedCarreras[careerIndex] = { ...updatedCarreras[careerIndex], ...updates };

    const updatedInstituciones = [...currentData.instituciones];
    updatedInstituciones[tecIndex] = {
      ...tec,
      carreras: updatedCarreras
    };

    this.dataSubject.next({
      ...currentData,
      instituciones: updatedInstituciones
    });
    this.saveData();

    return { success: true, message: 'Carrera actualizada' };
  }

  deleteCareer(tecId: number, careerId: number): { success: boolean; message: string } {
    const currentData = this.dataSubject.value;
    const tecIndex = currentData.instituciones.findIndex(t => t.id === tecId);

    if (tecIndex === -1) {
      return { success: false, message: 'Institución no encontrada' };
    }

    const tec = currentData.instituciones[tecIndex];
    const updatedInstituciones = [...currentData.instituciones];
    updatedInstituciones[tecIndex] = {
      ...tec,
      carreras: tec.carreras.filter(c => c.id !== careerId)
    };

    this.dataSubject.next({
      ...currentData,
      instituciones: updatedInstituciones
    });
    this.saveData();

    return { success: true, message: 'Carrera eliminada' };
  }

  // ==================== SESIÓN ====================

  setCurrentUser(user: User | null): void {
    const currentData = this.dataSubject.value;
    this.dataSubject.next({
      ...currentData,
      currentUser: user
    });
    this.saveData();
  }

  getCurrentUser(): User | null {
    return this.dataSubject.value.currentUser;
  }

  // ==================== UTILIDADES ====================

  exportData(): string {
    return JSON.stringify(this.dataSubject.value, null, 2);
  }

  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as DatabaseStructure;

      if (!parsed.usuarios || !parsed.instituciones) {
        return { success: false, message: 'Formato de datos inválido' };
      }

      this.dataSubject.next(parsed);
      this.saveData();

      return { success: true, message: 'Datos importados exitosamente' };
    } catch (error) {
      return { success: false, message: 'Error al parsear JSON' };
    }
  }

  resetData(): void {
    this.dataSubject.next({
      usuarios: [],
      instituciones: [],
      currentUser: null
    });
    this.saveData();
  }
}
