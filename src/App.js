import "./App.css";
import { useState, useEffect } from "react";
import axios from "axios";
import XMLData from "./data/wh40k-10e/Warhammer 40,000.gst";

function App() {
  const [name, setName] = useState("Wargame");
  const [sharedRules, setSharedRules] = useState([]);
  const [sharedProfiles, setSharedProfiles] = useState([]);

  useEffect(() => {
    axios
      .get(XMLData, {
        "Content-Type": "application/xml; charset=utf-8",
      })
      .then((response) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(response.data, "text/xml");

        setName(
          xmlDoc.getElementsByTagName("gameSystem")[0].getAttribute("name")
        );

        setSharedRules([]);
        xmlDoc
          .getElementsByTagName("sharedRules")[0]
          .childNodes.forEach((rule) => {
            if (rule.nodeName === "rule") {
              setSharedRules((sharedRules) => [...sharedRules, rule]);
            }
          });

        setSharedProfiles([]);
        xmlDoc
          .getElementsByTagName("sharedProfiles")[0]
          .childNodes.forEach((profile) => {
            if (profile.nodeName === "profile") {
              setSharedProfiles((sharedProfiles) => [
                ...sharedProfiles,
                profile,
              ]);
            }
          });
      });
  }, []);

  return (
    <div className="App container mx-auto bg-white p-8 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-1">Wargame Reminders</h1>
      <p className="mb-4">
        You are seeing data from <span>{name}</span>. Here are some rules:
      </p>
      <ul className="list-none">
        {sharedRules.map((rule, index) => (
          <li className="mb-2" key={index}>
            <span className="font-bold">{rule.getAttribute("name")}:</span>{" "}
            {rule.firstElementChild.innerHTML}
          </li>
        ))}
      </ul>
      <hr className="mb-2" />
      <ul className="list-none">
        {sharedProfiles.map((profile, index) => (
          <li className="mb-2" key={index}>
            <span className="font-bold">{profile.getAttribute("name")}:</span>{" "}
            {profile.firstElementChild.innerHTML}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
