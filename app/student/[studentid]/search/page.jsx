"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Siderbar from "@/public/components/Siderbar";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { auth, db } from "../../../firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  GoogleMap,
  Marker,
  InfoWindow,
  LoadScript,
  Autocomplete,
} from "@react-google-maps/api";

const mapContainerStyle = {
  width: "37vw",
  height: "80vh",
};

const libraries = ["places"]; // Add the "places" library

function Page({ params }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDistance, setSearchDistance] = useState(40); // Set default distance to 40 km
  const [teachers, setTeachers] = useState([]);
  const [user] = useAuthState(auth);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [center, setCenter] = useState({ lat: 80, lng: 13 });
  const [infoWindowPosition, setInfoWindowPosition] = useState(null);
  const [zoom, setZoom] = useState(14);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachersRef = collection(db, "courses");
        const querySnapshot = await getDocs(teachersRef);
        const teachersData = querySnapshot.docs.map((doc) => ({
          _id: doc.id,
          ...doc.data(),
        }));
        setTeachers(teachersData);
      } catch (error) {
        console.error("Error fetching teachers:", error.message);
      }
    };
    fetchTeachers();
  }, []);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleDistanceSearch = (event) => {
    setSearchDistance(parseInt(event.target.value, 10)); // Parse to an integer
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const calculateZoom = (dmax) => {
    let degree = dmax / 111 / 1.3;
    console.log("degree: ", degree);
    let zoom1 = Math.log2(360 / degree);
    return zoom1;
  };

  useEffect(() => {
    const updateFilteredTeachers = async () => {
      const filteredTeachersPromises = teachers.map(async (teacher) => {
        const studentData = doc(collection(db, "students"), user.uid);
        const studentDoc = await getDoc(studentData);
        const studentLatitude = studentDoc.data().latitude;
        const studentLongitude = studentDoc.data().longitude;

        console.log("student: ", studentDoc.data());

        setCenter({ lat: studentLatitude, lng: studentLongitude });

        let dmax = 0;

        const distance = calculateDistance(
          studentLatitude,
          studentLongitude,
          teacher.latitude,
          teacher.longitude
        );
        if (distance > dmax) {
          dmax = distance;
        }
        let degree = dmax / 111;
        console.log("degree: ", degree);
        let zoom1 = Math.log2(360 / degree);
        console.log("zoom1: ", zoom1);
        setZoom(zoom1);

        if (
          (teacher.teacherName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            teacher.studentConstraints
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            teacher.courseName
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) &&
          (distance <= searchDistance || !searchDistance)
        ) {
          console.log("teacher: ", teacher);
          return teacher;
        }

        return null; // Return null for teachers that don't match the criteria
      });

      const filteredTeachersArray = await Promise.all(filteredTeachersPromises);
      const finalFilteredTeachers = filteredTeachersArray.filter(
        (teacher) => teacher !== null
      );
      setFilteredTeachers(finalFilteredTeachers);
    };

    updateFilteredTeachers();
  }, [teachers, user, searchTerm, searchDistance]);

  const handleMarkerClick = (position) => {
    // Set the position for the InfoWindow
    setInfoWindowPosition(position);
  };

  return (
    <div className="bg-white h-screen w-full  flex p-4 gap-3">
      {/*Sidebar*/}
      <Siderbar params={params} />
      <div className="w-full">
        <div className="w-full flex bg-secondary justify-between items-center px-3 py-2 rounded-2xl ">
          <form>
            <div class="relative">
              <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none ">
                <svg
                  class="w-4 h-4 text-gray-500 "
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                class="block w-full p-4 ps-10 text-sm text-gray-900 border-2 border-gray-300 rounded-lg bg-gray-50 focus:border-primary focus:outline-none focus:bg-white"
                placeholder="Search by Name"
              />
            </div>
          </form>

          {/* <input
        type="text"
        value={searchTerm}
        onChange={handleSearch}
        placeholder="Search by name"
      /> */}
          <div className="w-content h-full  p-1 border-2 border-gray-300 bg-gray-50 rounded-lg">
            <input
              type="number"
              value={searchDistance}
              onChange={handleDistanceSearch}
              className="w-10 h-10  text-base placeholder-gray-600 text-center rounded-lg  focus:border-primary focus:outline-none"
            />
            <label>Filter by Distance:</label>
            <input
              type="range"
              min="1"
              max="100"
              value={searchDistance}
              onChange={handleDistanceSearch}
            />
          </div>
        </div>
        <div className="flex flex-row items-start justify-between w-full py-2 flex-wrap ">
          {/* <div className="w-[40vw] overflow-y-auto">
						{filteredTeachers &&
							filteredTeachers.map((teacher, index) => (
								<Link
									href={{
										pathname: `/student/${params.studentid}/teacherProfile/${teacher._id}`,
										query: {
											teachers: teacher._id,
										},
									}}
									key={index}
								>
									<div className="m-4 rounded-lg border-2 py-4 px-2">
                    <div className='w-full flex justify-center h-12'>
										<Image
											src="/user.png"
											width={500}
											height={500}
											alt="Picture"
                      className='h-20 w-20 rounded-full absolute border-4 border-white'
										/>
                    </div>
                    <div className='bg-secondary px-4 pt-10 flex flex-col items-center justify-center font-jacques shadow-sm'>
										<div className='text-2xl font-semibold'>{teacher.teacherName}</div>
										<div className='text-xl font-medium'>{teacher.courseName}</div>
										<div>{teacher.address}</div>
                    </div>
									</div>
								</Link>
							))}
					</div> */}
          <div className="w-[40vw] overflow-y-auto max-h-[calc(100vh)]">
            {filteredTeachers &&
              filteredTeachers.map((teacher, index) => (
                <Link
                  href={{
                    pathname: `/student/${params.studentid}/teacherProfile/${teacher._id}`,
                    query: {
                      teachers: teacher._id,
                    },
                  }}
                  key={index}
                >
                  <div className="m-4 rounded-lg border-2 py-4 px-2">
                    <div className="w-full flex justify-center h-12">
                      <Image
                        src="/user.png"
                        width={500}
                        height={500}
                        alt="Picture"
                        className="h-20 w-20 rounded-full border-4 border-white"
                      />
                    </div>
                    <div className="bg-secondary px-4 pt-10 flex flex-col items-center justify-center font-jacques shadow-sm">
                      <div className="text-2xl font-semibold">
                        {teacher.teacherName}
                      </div>
                      <div className="text-xl font-medium">
                        {teacher.courseName}
                      </div>
                      <div>{teacher.address}</div>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
          <div className="">
            <LoadScript
              googleMapsApiKey={
                process.env.NEXT_PUBLIC_REACT_APP_GOOGLE_MAPS_API_KEY
              }
              libraries={libraries}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={calculateZoom(searchDistance)}
                className="md:w-96 md:h-96 w-full"
              >
                {filteredTeachers.map((teacher, index) => (
                  <Marker
                    key={index}
                    position={{ lat: teacher.latitude, lng: teacher.longitude }}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: "red", // Set the marker color to red
                      fillOpacity: 1,
                      strokeColor: "white",
                      strokeWeight: 2,
                    }}
                    onClick={() =>
                      handleMarkerClick({
                        lat: teacher.latitude,
                        lng: teacher.longitude,
                      })
                    }
                  />
                ))}

                {/* Display InfoWindow if the position is set */}
                {infoWindowPosition && (
                  <InfoWindow position={infoWindowPosition}>
                    <div>
                      <h3>
                        {filteredTeachers[infoWindowPosition.index].teacherName}
                      </h3>
                      <p>
                        {filteredTeachers[infoWindowPosition.index].courseName}
                      </p>
                      <p>
                        {filteredTeachers[infoWindowPosition.index].address}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </GoogleMap>
            </LoadScript>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page;