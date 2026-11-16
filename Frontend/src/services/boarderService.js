import api, { isMockMode } from './api';

const STORAGE_KEY = 'messledger_boarders';

export const DEFAULT_BOARDERS = [];

export const boarderService = {
  /**
   * Get all boarders, optionally filtered by hostel
   */
  async getBoarders(hostel = null) {
    if (isMockMode) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        let list = stored ? JSON.parse(stored) : null;
        if (!list || !Array.isArray(list) || list.length === 0) {
          list = DEFAULT_BOARDERS;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }

        if (hostel) {
          const normHostel = hostel.trim().toUpperCase();
          return list.filter(
            (b) =>
              b.hostel.trim().toUpperCase() === normHostel ||
              normHostel.includes(b.hostel.trim().toUpperCase())
          );
        }
        return list;
      } catch (e) {
        console.error('Error fetching boarders from localStorage:', e);
        return DEFAULT_BOARDERS;
      }
    }

    try {
      const url = hostel ? `/boarders?hostel=${encodeURIComponent(hostel)}` : '/boarders';
      const data = await api.get(url);
      if (Array.isArray(data)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return data;
      }
      return [];
    } catch (e) {
      console.warn('API getBoarders failed, fallback to local storage:', e.message);
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_BOARDERS;
    }
  },

  /**
   * Save the full boarders list to localStorage
   */
  _save(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },

  /**
   * Add a new boarder record
   */
  async addBoarder({ rollNo, name, room, email, hostel = 'CMH', department, phone }) {
    if (isMockMode) {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_BOARDERS));
      const cleanRoll = rollNo.trim().toUpperCase();
      const cleanEmail = email.trim().toLowerCase();

      // Check duplicate institutional email
      const existingEmail = list.find((b) => b.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        throw new Error('This email already exists');
      }

      // Check duplicate roll number
      const existingRoll = list.find((b) => b.rollNo.toUpperCase() === cleanRoll);
      if (existingRoll) {
        throw new Error('This email already exists');
      }

      const newBoarder = {
        id: `bdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        rollNo: cleanRoll,
        name: name.trim(),
        room: room.trim(),
        email: cleanEmail,
        hostel: hostel.trim().toUpperCase(),
        department: department ? department.trim() : '',
        phone: phone ? phone.trim() : '',
        isRegistered: false,
        registeredAt: null,
        createdAt: new Date().toISOString(),
      };

      const updated = [newBoarder, ...list];
      this._save(updated);
      return newBoarder;
    }

    try {
      return await api.post('/boarders', { rollNo, name, room, email, hostel, department, phone });
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to add boarder.');
    }
  },

  /**
   * Bulk import boarders from an array of parsed records
   * [ { rollNo, name, room, email, hostel } ]
   */
  async addBoardersBulk(records, defaultHostel = 'CMH') {
    if (isMockMode) {
      const currentList = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_BOARDERS));
      const existingRolls = new Set(currentList.map((b) => b.rollNo.toUpperCase()));
      const existingEmails = new Set(currentList.map((b) => b.email.toLowerCase()));

      const added = [];
      const skipped = [];

      records.forEach((rec, idx) => {
        const cleanRoll = (rec.rollNo || '').trim().toUpperCase();
        const cleanEmail = (rec.email || '').trim().toLowerCase();
        const cleanName = (rec.name || '').trim();
        const cleanRoom = (rec.room || '').trim();
        const hostel = (rec.hostel || defaultHostel).trim().toUpperCase();

        if (!cleanRoll || !cleanEmail || !cleanName || !cleanRoom) {
          skipped.push({ row: idx + 1, reason: 'Missing required fields' });
          return;
        }

        if (existingRolls.has(cleanRoll)) {
          skipped.push({ row: idx + 1, rollNo: cleanRoll, reason: 'Duplicate Roll Number' });
          return;
        }

        if (existingEmails.has(cleanEmail)) {
          skipped.push({ row: idx + 1, email: cleanEmail, reason: 'Duplicate Email ID' });
          return;
        }

        const newBdr = {
          id: `bdr_${Date.now()}_${idx}`,
          rollNo: cleanRoll,
          name: cleanName,
          room: cleanRoom,
          email: cleanEmail,
          hostel,
          department: rec.department ? rec.department.trim() : '',
          phone: rec.phone ? rec.phone.trim() : '',
          isRegistered: false,
          registeredAt: null,
          createdAt: new Date().toISOString(),
        };

        existingRolls.add(cleanRoll);
        existingEmails.add(cleanEmail);
        added.push(newBdr);
      });

      if (added.length > 0) {
        this._save([...added, ...currentList]);
      }

      return { added, skipped };
    }

    try {
      const response = await api.post('/boarders/bulk', { records, defaultHostel });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Bulk import failed.');
    }
  },

  /**
   * Update an existing boarder record
   */
  async updateBoarder(id, updates) {
    if (isMockMode) {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_BOARDERS));
      const targetIdx = list.findIndex((b) => b.id === id);
      if (targetIdx === -1) {
        throw new Error('Boarder record not found.');
      }

      const current = list[targetIdx];
      const cleanRoll = updates.rollNo ? updates.rollNo.trim().toUpperCase() : current.rollNo;
      const cleanEmail = updates.email ? updates.email.trim().toLowerCase() : current.email;

      const emailConflict = list.find((b) => b.id !== id && b.email.toLowerCase() === cleanEmail);
      if (emailConflict) {
        throw new Error('This email already exists');
      }

      // Check collision with other boarders
      const rollConflict = list.find((b) => b.id !== id && b.rollNo.toUpperCase() === cleanRoll);
      if (rollConflict) {
        throw new Error('This email already exists');
      }

      const updated = {
        ...current,
        ...updates,
        rollNo: cleanRoll,
        email: cleanEmail,
        name: updates.name ? updates.name.trim() : current.name,
        room: updates.room ? updates.room.trim() : current.room,
        updatedAt: new Date().toISOString(),
      };

      list[targetIdx] = updated;
      this._save(list);
      return updated;
    }

    try {
      return await api.put(`/boarders/${id}`, updates);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update boarder.');
    }
  },

  /**
   * Delete a boarder record
   */
  async deleteBoarder(id) {
    if (isMockMode) {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_BOARDERS));
      const filtered = list.filter((b) => b.id !== id);
      this._save(filtered);
      return true;
    }

    try {
      await api.delete(`/boarders/${id}`);
      return true;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete boarder.');
    }
  },

  /**
   * Bulk delete boarder records by ID array
   */
  async deleteBoardersBulk(ids) {
    if (isMockMode) {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_BOARDERS));
      const idSet = new Set(ids);
      const filtered = list.filter((b) => !idSet.has(b.id));
      this._save(filtered);
      return { success: true, count: ids.length };
    }

    try {
      const response = await api.post('/boarders/bulk-delete', { ids });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to bulk remove boarders.');
    }
  },

  /**
   * Verify student credentials against the authorized Boarder Master List during registration
   * Throws informative errors if verification fails
   */
  async verifyStudentForRegistration({ rollNo, email, hostel, room: _room }) {
    if (isMockMode) {
      const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || JSON.stringify(DEFAULT_BOARDERS));
      const cleanRoll = (rollNo || '').trim().toUpperCase();
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanHostel = (hostel || '').trim().toUpperCase();

      // 1. Check if Roll Number exists on the master boarder list
      const boarderByRoll = list.find((b) => b.rollNo.toUpperCase() === cleanRoll);

      if (!boarderByRoll) {
        throw new Error(
          `Hostel Verification Failed: Roll Number "${cleanRoll}" is not on the approved resident roster for ${hostel}. Please contact your hostel superintendent to be added.`
        );
      }

      // 2. Check if hostel matches (allowing shorthand e.g. LBBH)
      const rosterHostel = boarderByRoll.hostel.toUpperCase();
      if (rosterHostel !== cleanHostel && !cleanHostel.includes(rosterHostel) && !rosterHostel.includes(cleanHostel)) {
        throw new Error(
          `Hostel Allocation Mismatch: Roll Number "${cleanRoll}" is assigned to "${boarderByRoll.hostel} Hostel", not "${hostel}". Please select your assigned hostel.`
        );
      }

      // 3. Verify institutional email ID matches
      if (boarderByRoll.email.toLowerCase() !== cleanEmail) {
        throw new Error(
          `Institution Email Mismatch: The email provided does not match the official university email registered for Roll Number ${cleanRoll} (${boarderByRoll.email}). Please use your registered institutional email.`
        );
      }

      // 4. Check if already registered
      if (boarderByRoll.isRegistered) {
        throw new Error(
          `Account Already Exists: Roll Number "${cleanRoll}" is already registered. Please proceed to the Sign In page.`
        );
      }

      return {
        verified: true,
        boarder: boarderByRoll,
      };
    }

    try {
      const response = await api.post('/boarders/verify', { rollNo, email, hostel });
      return response;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Student verification failed.');
    }
  },

  /**
   * Mark boarder as registered after successful student signup
   */
  markBoarderRegistered(rollNo) {
    const stored = localStorage.getItem(STORAGE_KEY);
    const list = stored ? JSON.parse(stored) : DEFAULT_BOARDERS;
    const cleanRoll = (rollNo || '').trim().toUpperCase();
    const updated = (Array.isArray(list) ? list : []).map((b) => {
      if (b.rollNo.toUpperCase() === cleanRoll) {
        return {
          ...b,
          isRegistered: true,
          registeredAt: new Date().toISOString(),
        };
      }
      return b;
    });
    this._save(updated);
  },
};
