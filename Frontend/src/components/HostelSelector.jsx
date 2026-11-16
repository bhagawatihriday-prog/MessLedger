import React, { useEffect, useState } from 'react';
import { Building2, DoorClosed } from 'lucide-react';
import { Select } from './Select';
import { hostelService } from '../services/hostelService';
import { HOSTEL_FULL_NAMES } from '../utils/constants';

export const HostelSelector = ({
  selectedHostel = '',
  selectedRoom = '',
  onHostelChange,
  onRoomChange,
  hostelError,
  roomError,
  disabled = false,
  className = '',
}) => {
  const [hostels, setHostels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load hostels dynamically from API
  useEffect(() => {
    let isMounted = true;
    const loadHostels = async () => {
      try {
        const data = await hostelService.getHostels();
        if (isMounted) {
          setHostels(data);
          // If a hostel is already selected, populate its rooms
          if (selectedHostel) {
            const matched = data.find(
              (h) => h.name.toUpperCase() === selectedHostel.toUpperCase()
            );
            if (matched) {
              setRooms(matched.rooms || []);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load hostels:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadHostels();
    return () => {
      isMounted = false;
    };
  }, [selectedHostel]);

  // Update rooms when selectedHostel changes
  const handleHostelChangeInternal = (e) => {
    const newHostelName = e.target.value;
    onHostelChange(newHostelName);
    // Reset room per requirements
    onRoomChange('');

    const matched = hostels.find(
      (h) => h.name.toUpperCase() === newHostelName.toUpperCase()
    );
    setRooms(matched ? matched.rooms : []);
  };

  const menHostels = hostels
    .filter(
      (h) =>
        (h.type || '').toUpperCase() === 'MEN' ||
        (!h.type && ['LBBH', 'CMH', 'NMH', 'KMH', 'PMH', 'SCVRMH', 'TMH'].includes(h.name.toUpperCase()))
    )
    .map((h) => ({
      value: h.name,
      label: `${h.name} — ${HOSTEL_FULL_NAMES[h.name] || h.fullName || h.name}`,
    }));

  const womenHostels = hostels
    .filter(
      (h) =>
        (h.type || '').toUpperCase() === 'WOMEN' ||
        (!h.type && ['KBGH', 'BWH', 'DWH', 'PWH', 'SWH', 'KWH', 'NWH', 'TWH'].includes(h.name.toUpperCase()))
    )
    .map((h) => ({
      value: h.name,
      label: `${h.name} — ${HOSTEL_FULL_NAMES[h.name] || h.fullName || h.name}`,
    }));

  const hostelOptions = [
    { group: "Men's Hostels (Boys)", items: menHostels },
    { group: "Women's Hostels (Girls)", items: womenHostels },
  ];

  const roomOptions = rooms.map((r) => ({
    value: r,
    label: `Room ${r}`,
  }));

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Hostel Dropdown */}
      <Select
        id="hostel-select"
        label="Hostel"
        placeholder={loading ? 'Loading hostels...' : 'Select Hostel'}
        options={hostelOptions}
        value={selectedHostel}
        onChange={handleHostelChangeInternal}
        error={hostelError}
        disabled={disabled || loading}
        icon={Building2}
        required
      />

      {/* Room Dropdown (Dynamically updated) */}
      <Select
        id="room-select"
        label="Room Number"
        placeholder={
          !selectedHostel
            ? 'Select a hostel first'
            : rooms.length === 0
            ? 'No rooms available'
            : 'Select Room Number'
        }
        options={roomOptions}
        value={selectedRoom}
        onChange={(e) => onRoomChange(e.target.value)}
        error={roomError}
        disabled={disabled || !selectedHostel || rooms.length === 0}
        icon={DoorClosed}
        required
      />
    </div>
  );
};
